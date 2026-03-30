import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { motion } from "motion/react";
import Calendar from "react-calendar";
import { ArrowLeft, CalendarDays, CreditCard, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { AuthContext } from "../context/AuthContext";
import { fetchLocationSuggestions, type LocationSuggestion } from "../lib/locations";
import { submitRental } from "../lib/rentals";
import { getVehicleById, type PaymentMethod } from "../lib/vrms";

type CalendarSelection = Date | null | [Date | null, Date | null];

type BookingDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  maxDate?: Date;
  popupPosition?: "top" | "bottom";
};

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function toDate(value: string) {
  if (!value) {
    return null;
  }

  return parseISO(value);
}

function toIsoDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function formatDateDisplay(value: string) {
  if (!value) {
    return "";
  }

  return format(parseISO(value), "dd-MM-yyyy");
}

function normalizeCalendarSelection(value: CalendarSelection) {
  return Array.isArray(value) ? value[0] : value;
}

function clampDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = differenceInCalendarDays(end, start);
  return diff >= 0 ? Math.max(diff, 1) : 0;
}

function isValidLicenseNumber(value: string) {
  return /^[A-Z]{2}-?\d{2}\d{4}\d{7}$/.test(value.trim().toUpperCase());
}

function BookingDateField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  popupPosition = "bottom",
}: BookingDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = useMemo(() => toDate(value), [value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all hover:border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
      >
        <span className={value ? "" : "text-slate-400 dark:text-slate-500"}>{formatDateDisplay(value) || "dd-mm-yyyy"}</span>
        <CalendarDays className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen ? (
        <div
          className={`absolute left-0 z-30 w-full min-w-[210px] max-w-[230px] ${
            popupPosition === "top" ? "bottom-[calc(100%+0.55rem)]" : "top-[calc(100%+0.55rem)]"
          }`}
        >
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-2.5 shadow-2xl shadow-slate-900/12 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/35">
            <Calendar
              value={selectedDate}
              onChange={(nextValue) => {
                const nextDate = normalizeCalendarSelection(nextValue as CalendarSelection);
                if (!nextDate) {
                  return;
                }

                onChange(toIsoDate(nextDate));
                setIsOpen(false);
              }}
              minDate={minDate}
              maxDate={maxDate}
              prev2Label={null}
              next2Label={null}
              showNeighboringMonth={false}
              className="dreamcar-calendar w-full border-0 bg-transparent"
              tileClassName="dreamcar-calendar__tile"
              navigationLabel={({ date }) => (
                <span className="text-xs font-black text-slate-900 dark:text-white">{format(date, "MMM yyyy")}</span>
              )}
              formatShortWeekday={(_, date) => format(date, "EEEEE")}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userToken } = useContext(AuthContext);

  const vehicle = useMemo(() => (id ? getVehicleById(id) : null), [id]);
  const today = useMemo(() => getLocalDateString(), []);
  const todayDate = useMemo(() => toDate(today) ?? new Date(), [today]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [licenseFullName, setLicenseFullName] = useState(user?.name || "");
  const [licenseDob, setLicenseDob] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const latestLocationRequest = useRef(0);

  useEffect(() => {
    const query = location.trim();

    if (query.length < 2) {
      setLocationSuggestions([]);
      setIsLocationMenuOpen(false);
      setIsLoadingLocations(false);
      return;
    }

    const requestId = latestLocationRequest.current + 1;
    latestLocationRequest.current = requestId;

    setIsLoadingLocations(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const suggestions = await fetchLocationSuggestions(query);

        if (latestLocationRequest.current !== requestId) {
          return;
        }

        setLocationSuggestions(suggestions);
        setIsLocationMenuOpen(suggestions.length > 0);
      } catch {
        if (latestLocationRequest.current !== requestId) {
          return;
        }

        setLocationSuggestions([]);
        setIsLocationMenuOpen(false);
      } finally {
        if (latestLocationRequest.current === requestId) {
          setIsLoadingLocations(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location]);

  if (!vehicle) {
    return (
      <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-lg font-bold text-slate-900 dark:text-white">Vehicle not found</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pick a vehicle from Explore first.</p>
          <Link
            to="/explore"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600"
          >
            Explore vehicles
          </Link>
        </div>
      </div>
    );
  }

  const days = clampDays(startDate, endDate);
  const total = days * vehicle.pricePerDay;
  const hasValidLicenseNumber = isValidLicenseNumber(licenseNumber);
  const canSubmit = Boolean(
    days > 0 &&
      location.trim() &&
      licenseFullName.trim() &&
      licenseDob &&
      hasValidLicenseNumber &&
      licenseExpiry,
  );

  const handleSubmit = async () => {
    if (!user?.email || !userToken) {
      navigate(`/login?redirect=${encodeURIComponent(`/booking/${vehicle.id}`)}`);
      return;
    }

    if (!canSubmit) {
      if (licenseNumber.trim() && !hasValidLicenseNumber) {
        toast.error("License number must match AA00YYYY0000000 or AA-00YYYY0000000.");
        return;
      }

      toast.error("Please fill all fields and select a valid date range.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitRental(userToken, {
        booking: {
          vehicleId: vehicle.id,
          startDate,
          endDate,
          location: location.trim(),
          paymentMethod,
          totalPrice: total,
        },
        license: {
          fullName: licenseFullName.trim(),
          dob: licenseDob,
          licenseNumber: licenseNumber.trim().toUpperCase(),
          expiry: licenseExpiry,
        },
      });

      const bookingToastMessage =
        result.emailStatus === "sent"
          ? "Booking submitted. Confirmation email sent."
          : result.emailStatus === "not_configured"
            ? "Booking submitted. Email confirmation is not configured yet."
            : "Booking submitted, but the confirmation email could not be sent.";

      toast.success(bookingToastMessage);
      navigate("/dashboard/bookings");
    } catch (error: any) {
      toast.error(error.message || "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to={`/vehicle/${vehicle.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300">
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </Link>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            {vehicle.name}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-slate-900"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Booking</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Select dates and location</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Provide your details to complete the booking request.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <BookingDateField
                label="Start date"
                value={startDate}
                minDate={todayDate}
                onChange={(nextStartDate) => {
                  setStartDate(nextStartDate);

                  if (endDate && nextStartDate && endDate < nextStartDate) {
                    setEndDate("");
                  }
                }}
              />
              <BookingDateField
                label="End date"
                value={endDate}
                minDate={toDate(startDate) ?? todayDate}
                onChange={setEndDate}
              />

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Location</label>
                <div
                  className="relative"
                  onBlur={() => {
                    window.setTimeout(() => setIsLocationMenuOpen(false), 120);
                  }}
                >
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={location}
                    onFocus={() => {
                      if (locationSuggestions.length > 0) {
                        setIsLocationMenuOpen(true);
                      }
                    }}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Pickup location"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 pr-11 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  {isLoadingLocations ? (
                    <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  ) : null}

                  {isLocationMenuOpen ? (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.label}-${suggestion.subtitle}`}
                          type="button"
                          onMouseDown={() => {
                            setLocation(`${suggestion.label}, ${suggestion.subtitle}`);
                            setIsLocationMenuOpen(false);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                        >
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{suggestion.label}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{suggestion.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Payment method</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "upi", label: "UPI", meta: "Instant mobile payment" },
                  { value: "card", label: "Card", meta: "Debit or credit card" },
                  { value: "netbanking", label: "Net Banking", meta: "Pay from your bank" },
                  { value: "cash", label: "Cash", meta: "Pay at pickup" },
                ].map((option) => {
                  const selected = paymentMethod === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value as PaymentMethod)}
                      className={`rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                        selected
                          ? "border-blue-600 bg-blue-50 shadow-sm dark:bg-blue-500/10"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700"
                      }`}
                    >
                      <p className="text-sm font-black text-slate-900 dark:text-white">{option.label}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{option.meta}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">License information</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Full name</label>
                  <input
                    value={licenseFullName}
                    onChange={(event) => setLicenseFullName(event.target.value)}
                    placeholder="Name on license"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <BookingDateField
                  label="Date of birth"
                  value={licenseDob}
                  maxDate={todayDate}
                  onChange={setLicenseDob}
                  popupPosition="top"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">License number</label>
                  <input
                    value={licenseNumber}
                    onChange={(event) => setLicenseNumber(event.target.value.toUpperCase().replace(/\s+/g, ""))}
                    placeholder="DL-0120230000000"
                    maxLength={16}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  <p className={`mt-2 text-xs font-medium ${licenseNumber && !hasValidLicenseNumber ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}`}>
                    Format: AA00YYYY0000000 or AA-00YYYY0000000
                  </p>
                </div>

                <BookingDateField label="Expiry" value={licenseExpiry} onChange={setLicenseExpiry} popupPosition="top" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit booking"}
            </button>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.06 }}
            className="grid gap-6"
          >
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="aspect-[16/10] bg-slate-100">
                <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <p className="text-lg font-black text-slate-900 dark:text-white">{vehicle.name}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Rs. {formatInr(vehicle.pricePerDay)}/day | {vehicle.type}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Summary</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Payment</h2>

              <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-800">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Days</span>
                  <span>{days || "--"}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Rate</span>
                  <span>Rs. {formatInr(vehicle.pricePerDay)}/day</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Payment</span>
                  <span className="capitalize">{paymentMethod}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-white/10" />
                <div className="flex items-center justify-between text-base font-black text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span>Rs. {formatInr(total)}</span>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                Submitting creates your booking request and saves the trip details to your account.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
