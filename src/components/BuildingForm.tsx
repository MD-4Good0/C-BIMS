import { useMemo, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { Check, ChevronDown } from "lucide-react";

type BuildingFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  submitting: boolean;
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  colleges: any[];
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  handleChange: (e: any) => void;
  calculateFutureRenovation: () => number;
};

type FieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

type SectionProps = {
  title: string;
  children: ReactNode;
};

type TextInputProps = {
  name: string;
  form: any;
  handleChange: (e: any) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number;
  value?: any;
};

function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-black">
        {label} {required && <span className="text-upred">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-bold text-upred">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  name,
  form,
  handleChange,
  type = "text",
  placeholder,
  required,
  disabled,
  readOnly,
  min,
  value,
}: TextInputProps) {
  const isDisabled = disabled || readOnly;

  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value ?? form[name] ?? ""}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      min={min}
      className={`w-full rounded-lg border border-upred/30 p-3 transition focus:border-upred focus:outline-none ${
        isDisabled ? "cursor-not-allowed bg-black/5 text-black/50" : "bg-white/90"
      }`}
    />
  );
}

function ToggleField({
  name,
  label,
  form,
  setForm,
}: {
  name: string;
  label: string;
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
}) {
  const active = Boolean(form[name]);

  function toggleBoolean() {
    setForm((prev: any) => {
      const nextValue = !Boolean(prev[name]);

      const nextForm = {
        ...prev,
        [name]: nextValue,
      };

      if (name === "renovated_bool" && !nextValue) {
        nextForm.renovated_area = "";
      }

      if (name === "ongoing_renovation" && !nextValue) {
        nextForm.ongoing_renovation_area = "";
      }

      if (name === "elevator" && !nextValue) {
        nextForm.elevator_permit_issue = "";
        nextForm.elevator_permit_expiration = "";
      }

      if (name === "generator" && !nextValue) {
        nextForm.generator_issue_date = "";
        nextForm.generator_expiration_date = "";
      }

      if (name === "has_attachment" && !nextValue) {
        nextForm.file_link = "";
      }

      return nextForm;
    });
  }

  return (
    <button
      type="button"
      onClick={toggleBoolean}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition hover:scale-[1.01] ${
        active
          ? "border-upgreen/30 bg-upgreen/10 text-upgreen"
          : "border-upred/20 bg-white text-black/70 hover:bg-upred/5"
      }`}
    >
      <span>{label}</span>

      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border ${
          active
            ? "border-upgreen bg-upgreen text-white"
            : "border-black/20 bg-white text-transparent"
        }`}
      >
        <Check className="h-4 w-4" />
      </span>
    </button>
  );
}

export default function BuildingForm({
  title,
  description,
  submitLabel,
  submitting,
  form,
  setForm,
  colleges,
  onSubmit,
  onCancel,
  handleChange,
  calculateFutureRenovation,
}: BuildingFormProps) {
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const selectedCollegeName = useMemo(() => {
    if (!form.college_id) return "Select College";

    return (
      colleges.find((college) => String(college.id) === String(form.college_id))
        ?.name || "Select College"
    );
  }, [colleges, form.college_id]);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="mb-4 flex w-full justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold leading-none text-upred">
            {title}
          </h1>
          <p className="mt-2 text-sm text-black/60">{description}</p>
          <p className="mt-1 text-xs text-black/40">
            Fields marked with <span className="text-upred">*</span> are required.
          </p>
        </div>
      </div>

      <div className="mb-6 h-px w-full bg-black/10" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Basic Information">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <Field label="College" required>
                <button
                  type="button"
                  onClick={() => setShowCollegeDropdown((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-upred/30 bg-white/90 p-3 text-left transition hover:border-upred/50"
                >
                  <span className={form.college_id ? "text-black" : "text-black/40"}>
                    {selectedCollegeName}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 text-black/50 transition ${
                      showCollegeDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showCollegeDropdown && (
                  <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-upred/20 bg-white shadow-xl">
                    {colleges.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-black/50">
                        No colleges found.
                      </div>
                    ) : (
                      colleges.map((college) => {
                        const selected =
                          String(college.id) === String(form.college_id);

                        return (
                          <button
                            key={college.id}
                            type="button"
                            onClick={() => {
                              setForm((prev: any) => ({
                                ...prev,
                                college_id: String(college.id),
                              }));
                              setShowCollegeDropdown(false);
                            }}
                            className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                              selected ? "font-semibold text-upred" : "text-black"
                            }`}
                          >
                            {college.name}
                            {selected && <Check className="h-4 w-4" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </Field>
            </div>

            <Field label="Building Name" required>
              <TextInput
                name="building_name"
                form={form}
                handleChange={handleChange}
                placeholder="Building name"
                required
              />
            </Field>

            <Field label="Number of Floors" required>
              <TextInput
                name="num_floors"
                form={form}
                handleChange={handleChange}
                type="number"
                placeholder="Number of floors"
                required
                min={1}
              />
            </Field>

            <Field label="Building Footprint (sqm)" required>
              <TextInput
                name="footprint"
                form={form}
                handleChange={handleChange}
                type="number"
                placeholder="Building footprint"
                required
                min={1}
              />
            </Field>

            <Field label="Total Floor Area (sqm)" required>
              <TextInput
                name="total_floor_area"
                form={form}
                handleChange={handleChange}
                type="number"
                placeholder="Total floor area"
                required
                min={1}
              />
            </Field>
          </div>
        </Section>

        <Section title="Renovation and Cost">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ToggleField
              name="renovated_bool"
              label="Renovated Areas"
              form={form}
              setForm={setForm}
            />
            <ToggleField
              name="ongoing_renovation"
              label="On-going Renovations"
              form={form}
              setForm={setForm}
            />

            <Field label="Total Floor Area for Renovated Works">
              <TextInput
                name="renovated_area"
                form={form}
                handleChange={handleChange}
                type="number"
                disabled={!form.renovated_bool}
                min={0}
              />
            </Field>

            <Field label="On-going Renovations Area">
              <TextInput
                name="ongoing_renovation_area"
                form={form}
                handleChange={handleChange}
                type="number"
                disabled={!form.ongoing_renovation}
                min={0}
              />
            </Field>

            <Field label="Future Renovation Area">
              <TextInput
                name="future_renovation"
                form={form}
                handleChange={handleChange}
                type="number"
                value={calculateFutureRenovation()}
                readOnly
              />
            </Field>

            <Field label="Cost per SQM" required>
              <TextInput
                name="cost_per_sqm"
                form={form}
                handleChange={handleChange}
                type="number"
                required
                min={1}
              />
            </Field>

            <Field label="Proposed Development Cost">
              <TextInput
                name="proposed_dev_cost"
                form={form}
                handleChange={handleChange}
                type="number"
                min={0}
              />
            </Field>
          </div>
        </Section>

        <Section title="Structural and Accessibility">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ToggleField name="structural_integrity" label="Structural Integrity Assessment" form={form} setForm={setForm} />
            <ToggleField name="retrofitting" label="Retrofitting" form={form} setForm={setForm} />
            <ToggleField name="repainting" label="Repainting" form={form} setForm={setForm} />
            <ToggleField name="ramp" label="Ramp" form={form} setForm={setForm} />
            <ToggleField name="elevator" label="Elevator" form={form} setForm={setForm} />
            <ToggleField name="pwd_restroom" label="PWD Rest Room" form={form} setForm={setForm} />
            <ToggleField name="gender_neutral_restroom" label="Gender Neutral Restroom" form={form} setForm={setForm} />
          </div>
        </Section>

        <Section title="Permits">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Building Permit Date Issued" required>
              <TextInput name="building_permit_date" form={form} handleChange={handleChange} type="date" required />
            </Field>

            <Field label="Occupancy Permit Date Issued" required>
              <TextInput name="occupancy_permit_date" form={form} handleChange={handleChange} type="date" required />
            </Field>

            <Field label="Elevator Permit Issue Date" required={form.elevator}>
              <TextInput
                name="elevator_permit_issue"
                form={form}
                handleChange={handleChange}
                type="date"
                required={form.elevator}
                disabled={!form.elevator}
              />
            </Field>

            <Field label="Elevator Permit Expiration Date" required={form.elevator}>
              <TextInput
                name="elevator_permit_expiration"
                form={form}
                handleChange={handleChange}
                type="date"
                required={form.elevator}
                disabled={!form.elevator}
              />
            </Field>
          </div>
        </Section>

        <Section title="Utilities and Safety">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ToggleField name="generator" label="Generator" form={form} setForm={setForm} />
            <ToggleField name="cistern" label="Cistern" form={form} setForm={setForm} />
            <ToggleField name="septic_tank" label="Septic Tank" form={form} setForm={setForm} />
            <ToggleField name="electrical_wiring" label="Upgraded Electrical Wiring" form={form} setForm={setForm} />
            <ToggleField name="lvsg" label="Upgraded Electrical Connection LVSG" form={form} setForm={setForm} />
            <ToggleField name="fdas" label="FDAS" form={form} setForm={setForm} />
            <ToggleField name="fire_protection" label="Fire Protection System" form={form} setForm={setForm} />
            <ToggleField name="ventilation" label="Ventilation" form={form} setForm={setForm} />
            <ToggleField name="fiber_lan" label="Fiber Optics / Structured Cabling / LAN" form={form} setForm={setForm} />
          </div>

          {form.generator && (
            <div className="mt-5 rounded-2xl border border-upgreen/20 bg-upgreen/5 p-4">
              <h3 className="mb-3 text-sm font-bold text-upgreen">
                Generator Dates
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Generator Issue Date" required>
                  <TextInput
                    name="generator_issue_date"
                    form={form}
                    handleChange={handleChange}
                    type="date"
                    required={form.generator}
                  />
                </Field>

                <Field label="Generator Expiration Date" required>
                  <TextInput
                    name="generator_expiration_date"
                    form={form}
                    handleChange={handleChange}
                    type="date"
                    required={form.generator}
                  />
                </Field>
              </div>
            </div>
          )}
        </Section>

        <Section title="Environmental Compliance">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <ToggleField name="cmr_submission" label="CMR Submission" form={form} setForm={setForm} />
            <ToggleField name="smr_submission" label="SMR Submission" form={form} setForm={setForm} />
            <ToggleField name="testing_requirements" label="Testing Requirements" form={form} setForm={setForm} />
          </div>
        </Section>

        <Section title="Attachments">
          <div className="grid grid-cols-1 gap-4">
            <ToggleField name="has_attachment" label="Has Attachment" form={form} setForm={setForm} />

            <Field label="File Link / Path" required={form.has_attachment}>
              <TextInput
                name="file_link"
                form={form}
                handleChange={handleChange}
                placeholder="Paste Google Drive link or file storage path"
                required={form.has_attachment}
                disabled={!form.has_attachment}
              />
            </Field>

            {form.has_attachment && form.file_link?.trim() && (
              <a
                href={form.file_link.trim()}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-upred underline underline-offset-4"
              >
                Open current attachment
              </a>
            )}
          </div>
        </Section>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}