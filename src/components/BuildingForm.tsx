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
  calculateFutureRenovation?: () => number;
};

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
};

type TextInputProps = {
  name: string;
  form: any;
  handleChange: (e: any) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  min?: number;
  step?: number | string;
  value?: any;
};

type TextAreaInputProps = {
  name: string;
  form: any;
  handleChange: (e: any) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  rows?: number;
};

type CheckboxInputProps = {
  name: string;
  label: string;
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  clearFields?: string[];
};

function asBoolean(value: any) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function hasDecimalValue(value: any) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function parseDecimal(value: any) {
  if (!hasDecimalValue(value)) return 0;

  const cleanedValue = String(value)
    .replace(/,/g, "")
    .replace(/[^0-9.\-]/g, "");

  const firstDecimalIndex = cleanedValue.indexOf(".");

  const normalizedValue =
    firstDecimalIndex === -1
      ? cleanedValue
      : cleanedValue.slice(0, firstDecimalIndex + 1) +
        cleanedValue.slice(firstDecimalIndex + 1).replace(/\./g, "");

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatDecimal(value: number) {
  if (!Number.isFinite(value)) return "";

  return value.toFixed(2);
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-upred/15 bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="border-b border-upred/10 bg-upred/[0.03] px-5 py-4">
        <h2 className="text-lg font-bold text-upred">{title}</h2>
      </div>

      <div className="divide-y divide-black/5">{children}</div>
    </section>
  );
}

function FormRow({ label, required, hint, children }: FormRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[260px_1fr] md:items-start">
      <div>
        <label className="block text-sm font-semibold leading-snug text-black">
          {label} {required && <span className="text-upred">*</span>}
        </label>

        {hint && <p className="mt-1 text-xs leading-snug text-black/45">{hint}</p>}
      </div>

      <div>{children}</div>
    </div>
  );
}

function TextInput({
  name,
  form,
  handleChange,
  type = "text",
  placeholder,
  required,
  readOnly,
  min,
  step,
  value,
}: TextInputProps) {
  const isNumberLike = type === "number";

  return (
    <input
      name={name}
      type={isNumberLike ? "text" : type}
      placeholder={placeholder}
      value={value ?? form[name] ?? ""}
      onChange={handleChange}
      required={required}
      readOnly={readOnly}
      min={isNumberLike ? undefined : min}
      step={isNumberLike ? undefined : step}
      inputMode={isNumberLike ? "decimal" : undefined}
      className={`w-full rounded-lg border border-upred/25 px-3 py-2.5 text-sm transition placeholder:text-black/35 focus:border-upred focus:outline-none ${
        readOnly ? "cursor-default bg-black/[0.03] text-black/70" : "bg-white"
      }`}
    />
  );
}

function TextAreaInput({
  name,
  form,
  handleChange,
  placeholder,
  required,
  readOnly,
  rows = 3,
}: TextAreaInputProps) {
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      value={form[name] ?? ""}
      onChange={handleChange}
      required={required}
      readOnly={readOnly}
      rows={rows}
      className={`w-full resize-none rounded-lg border border-upred/25 px-3 py-2.5 text-sm transition placeholder:text-black/35 focus:border-upred focus:outline-none ${
        readOnly ? "cursor-default bg-black/[0.03] text-black/70" : "bg-white"
      }`}
    />
  );
}

function CheckboxInput({
  name,
  label,
  form,
  setForm,
  clearFields = [],
}: CheckboxInputProps) {
  const checked = asBoolean(form[name]);

  function handleToggle() {
    setForm((prev: any) => {
      const nextValue = !asBoolean(prev[name]);

      const nextForm = {
        ...prev,
        [name]: nextValue,
      };

      if (!nextValue) {
        clearFields.forEach((field) => {
          nextForm[field] = "";
        });
      }

      return nextForm;
    });
  }

  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={handleToggle}
      className={`flex min-h-[44px] w-full items-center rounded-lg border px-3 py-2 text-left text-sm transition ${
        checked
          ? "border-upgreen/50 bg-upgreen/10 font-medium text-upgreen"
          : "border-black/10 bg-white text-black/70 hover:border-upgreen/35 hover:bg-upgreen/[0.06] hover:text-upgreen"
      }`}
    >
      <span className="leading-snug">{label}</span>
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
}: BuildingFormProps) {
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const selectedCollegeName = useMemo(() => {
    if (!form.college_id) return "Select college";

    return (
      colleges.find((college) => String(college.id) === String(form.college_id))
        ?.name || "Select college"
    );
  }, [colleges, form.college_id]);

  const computedProposedDevelopmentCost = useMemo(() => {
    if (!hasDecimalValue(form.future_renovation) || !hasDecimalValue(form.cost_per_sqm)) {
      return "";
    }

    const futureRenovation = parseDecimal(form.future_renovation);
    const costPerSqm = parseDecimal(form.cost_per_sqm);

    return formatDecimal(futureRenovation * costPerSqm);
  }, [form.future_renovation, form.cost_per_sqm]);

  function updateProposedDevelopmentCost(nextForm: any) {
    if (!hasDecimalValue(nextForm.future_renovation) || !hasDecimalValue(nextForm.cost_per_sqm)) {
      return {
        ...nextForm,
        proposed_dev_cost: "",
      };
    }

    const futureRenovation = parseDecimal(nextForm.future_renovation);
    const costPerSqm = parseDecimal(nextForm.cost_per_sqm);

    return {
      ...nextForm,
      proposed_dev_cost: formatDecimal(futureRenovation * costPerSqm),
    };
  }

  function handleFieldChange(e: any) {
    const { name, value } = e.target;

    setForm((prev: any) => {
      const nextForm = {
        ...prev,
        [name]: value,
      };

      if (name === "future_renovation" || name === "cost_per_sqm") {
        return updateProposedDevelopmentCost(nextForm);
      }

      return nextForm;
    });
  }

  function handleCollegeSelect(value: string) {
    setForm((prev: any) => ({
      ...prev,
      college_id: value,
    }));

    setShowCollegeDropdown(false);
  }

  const pwdFields = [
    {
      name: "ramp",
      label: "Ramp",
      detailName: "ramp_location_plan",
    },
    {
      name: "elevator",
      label: "Elevator",
      detailName: "elevator_location_plan",
    },
    {
      name: "pwd_restroom",
      label: "PWD Rest Room",
      detailName: "pwd_restroom_location_plan",
    },
    {
      name: "gender_neutral_restroom",
      label: "Gender Neutral Restroom",
      detailName: "gender_neutral_restroom_location_plan",
    },
  ];

  const utilityFields = [
    {
      name: "generator",
      label: "Generator",
      detailName: "generator_location_plan",
    },
    {
      name: "cistern",
      label: "Cistern",
      detailName: "cistern_location_plan",
    },
    {
      name: "septic_tank",
      label: "Septic Tank",
      detailName: "septic_tank_location_plan",
    },
    {
      name: "electrical_wiring",
      label: "Upgraded Electrical Wiring",
      detailName: "electrical_wiring_location_plan",
    },
    {
      name: "lvsg",
      label: "Upgraded Electrical Connection LVSG",
      detailName: "lvsg_location_plan",
    },
    {
      name: "fdas",
      label: "FDAS",
      detailName: "fdas_location_plan",
    },
    {
      name: "fire_protection",
      label: "Fire Protection System",
      detailName: "fire_protection_location_plan",
    },
    {
      name: "ventilation",
      label: "Ventilation",
      detailName: "ventilation_location_plan",
    },
    {
      name: "fiber_lan",
      label: "Fiber Optics / Structured Cabling / LAN",
      detailName: "fiber_lan_location_plan",
    },
  ];

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold leading-none text-upred">{title}</h1>
        <p className="mt-2 text-sm text-black/60">{description}</p>
        <p className="mt-1 text-xs text-black/40">
          Fields marked with <span className="text-upred">*</span> are required.
        </p>
      </div>

      <FormSection title="Basic Information">
        <FormRow label="College" required>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCollegeDropdown((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-upred/25 bg-white px-3 py-2.5 text-left text-sm transition hover:border-upred/50 focus:border-upred focus:outline-none"
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
                    const isSelected =
                      String(college.id) === String(form.college_id);

                    return (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => handleCollegeSelect(String(college.id))}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-upred/5 ${
                          isSelected ? "font-semibold text-upred" : "text-black"
                        }`}
                      >
                        {college.name}
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </FormRow>

        <FormRow label="Building Name" required>
          <TextInput
            name="building_name"
            form={form}
            handleChange={handleFieldChange}
            required
          />
        </FormRow>

        <FormRow label="Number of Floors" required hint="Whole numbers only.">
          <TextInput
            name="num_floors"
            form={form}
            handleChange={handleFieldChange}
            type="number"
            required
            min={1}
            step={1}
          />
        </FormRow>

        <FormRow label="Building Footprint" required hint="Square meters. Decimals are allowed.">
          <TextInput
            name="footprint"
            form={form}
            handleChange={handleFieldChange}
            type="number"
            placeholder="Decimals allowed"
            required
            min={0}
            step="0.01"
          />
        </FormRow>

        <FormRow label="Total Floor Area" required hint="Square meters. Decimals are allowed.">
          <TextInput
            name="total_floor_area"
            form={form}
            handleChange={handleFieldChange}
            type="number"
            placeholder="Decimals allowed"
            required
            min={0}
            step="0.01"
          />
        </FormRow>

        <FormRow label="Building Footprint / Floor Plan Link">
          <TextInput
            name="footprint_plan_link"
            form={form}
            handleChange={handleFieldChange}
            placeholder="Paste link or storage path, or leave empty if none"
          />
        </FormRow>

        <FormRow label="Key Plans Showing Renovated Areas">
          <TextInput
            name="key_plans"
            form={form}
            handleChange={handleFieldChange}
            placeholder="Enter plan reference, or leave empty if none"
          />
        </FormRow>
      </FormSection>

      <FormSection title="Renovation and Cost">
        <FormRow label="Renovation Status">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <CheckboxInput
              name="renovated_bool"
              label="Renovated Areas"
              form={form}
              setForm={setForm}
              clearFields={["renovated_area", "year_renovated"]}
            />

            <CheckboxInput
              name="ongoing_renovation"
              label="On-going Renovations"
              form={form}
              setForm={setForm}
              clearFields={["ongoing_renovation_area"]}
            />
          </div>
        </FormRow>

        {asBoolean(form.renovated_bool) && (
          <>
            <FormRow
              label="Total Floor Area for Renovated Works"
              hint="Square meters. Decimals are allowed."
            >
              <TextInput
                name="renovated_area"
                form={form}
                handleChange={handleFieldChange}
                type="number"
                placeholder="Decimals allowed"
                min={0}
                step="0.01"
              />
            </FormRow>

            <FormRow label="Year Renovated">
              <TextInput
                name="year_renovated"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>
          </>
        )}

        {asBoolean(form.ongoing_renovation) && (
          <FormRow
            label="On-going Renovations Area"
            hint="Square meters. Decimals are allowed."
          >
            <TextInput
              name="ongoing_renovation_area"
              form={form}
              handleChange={handleFieldChange}
              type="number"
              placeholder="Decimals allowed"
              min={0}
              step="0.01"
            />
          </FormRow>
        )}

        <FormRow label="Future Renovation Area" hint="Square meters. Decimals are allowed.">
          <TextInput
            name="future_renovation"
            form={form}
            handleChange={handleFieldChange}
            type="number"
            placeholder="Decimals allowed"
            min={0}
            step="0.01"
          />
        </FormRow>

        <FormRow label="Cost per SQM" required hint="Pesos per square meter. Decimals are allowed.">
          <TextInput
            name="cost_per_sqm"
            form={form}
            handleChange={handleFieldChange}
            type="number"
            placeholder="Decimals allowed"
            required
            min={0}
            step="0.01"
          />
        </FormRow>

        <FormRow label="Proposed Development Cost" hint="Computed from future renovation area × cost per sqm.">
          <TextInput
            name="proposed_dev_cost"
            form={form}
            handleChange={handleFieldChange}
            type="number"
            value={computedProposedDevelopmentCost || form.proposed_dev_cost || ""}
            min={0}
            step="0.01"
            readOnly
          />
        </FormRow>
      </FormSection>

      <FormSection title="Structural Requirements">
        <FormRow label="Available Requirements">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <CheckboxInput
              name="structural_integrity"
              label="Structural Integrity Assessment"
              form={form}
              setForm={setForm}
              clearFields={["structural_integrity_remarks"]}
            />

            <CheckboxInput
              name="retrofitting"
              label="Retrofitting"
              form={form}
              setForm={setForm}
              clearFields={["retrofitting_date", "retrofitting_remarks"]}
            />

            <CheckboxInput
              name="repainting"
              label="Repainting"
              form={form}
              setForm={setForm}
              clearFields={["repainting_date", "repainting_remarks"]}
            />
          </div>
        </FormRow>

        {asBoolean(form.structural_integrity) && (
          <FormRow label="Structural Integrity Details">
            <TextAreaInput
              name="structural_integrity_remarks"
              form={form}
              handleChange={handleFieldChange}
              placeholder="Enter assessment details, or leave empty if none"
            />
          </FormRow>
        )}

        {asBoolean(form.retrofitting) && (
          <>
            <FormRow label="Retrofitting Date">
              <TextInput
                name="retrofitting_date"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Retrofitting Details / Location">
              <TextInput
                name="retrofitting_remarks"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Enter details or location, or leave empty if none"
              />
            </FormRow>
          </>
        )}

        {asBoolean(form.repainting) && (
          <>
            <FormRow label="Repainting Date">
              <TextInput
                name="repainting_date"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Repainting Details / Remarks">
              <TextInput
                name="repainting_remarks"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Enter remarks, or leave empty if none"
              />
            </FormRow>
          </>
        )}
      </FormSection>

      <FormSection title="PWD Requirements">
        <FormRow label="Available PWD Requirements">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pwdFields.map((item) => (
              <CheckboxInput
                key={item.name}
                name={item.name}
                label={item.label}
                form={form}
                setForm={setForm}
                clearFields={[item.detailName]}
              />
            ))}
          </div>
        </FormRow>

        {pwdFields.map(
          (item) =>
            asBoolean(form[item.name]) && (
              <FormRow key={item.detailName} label={`${item.label} Location on Plan / Remarks`}>
                <TextInput
                  name={item.detailName}
                  form={form}
                  handleChange={handleFieldChange}
                  placeholder="Enter location or remarks, or leave empty if none"
                />
              </FormRow>
            )
        )}
      </FormSection>

      <FormSection title="Permits Availability and Relevant Dates">
        <FormRow label="Available Permits">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <CheckboxInput
              name="has_building_permit"
              label="Building Permit"
              form={form}
              setForm={setForm}
              clearFields={["building_permit_date", "building_permit_file_link"]}
            />

            <CheckboxInput
              name="has_occupancy_permit"
              label="Occupancy Permit"
              form={form}
              setForm={setForm}
              clearFields={["occupancy_permit_date", "occupancy_permit_file_link"]}
            />

            <CheckboxInput
              name="has_elevator_permit"
              label="Permit to Operate Elevator"
              form={form}
              setForm={setForm}
              clearFields={[
                "elevator_permit_issue",
                "elevator_permit_expiration",
                "elevator_permit_file_link",
                "elevator_permit_remarks",
              ]}
            />

            <CheckboxInput
              name="has_generator_permit"
              label="Permit to Operate Generator"
              form={form}
              setForm={setForm}
              clearFields={[
                "generator_issue_date",
                "generator_expiration_date",
                "generator_permit_file_link",
                "generator_permit_remarks",
              ]}
            />
          </div>
        </FormRow>

        {asBoolean(form.has_building_permit) && (
          <>
            <FormRow label="Building Permit Date Issued">
              <TextInput
                name="building_permit_date"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Building Permit File / Drive Location">
              <TextInput
                name="building_permit_file_link"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Paste link or storage path, or leave empty if none"
              />
            </FormRow>
          </>
        )}

        {asBoolean(form.has_occupancy_permit) && (
          <>
            <FormRow label="Occupancy Permit Date Issued">
              <TextInput
                name="occupancy_permit_date"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Occupancy Permit File / Drive Location">
              <TextInput
                name="occupancy_permit_file_link"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Paste link or storage path, or leave empty if none"
              />
            </FormRow>
          </>
        )}

        {asBoolean(form.has_elevator_permit) && (
          <>
            <FormRow label="Elevator Permit Issue Date">
              <TextInput
                name="elevator_permit_issue"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Elevator Permit Expiration Date">
              <TextInput
                name="elevator_permit_expiration"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Elevator Permit File / Drive Location">
              <TextInput
                name="elevator_permit_file_link"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Paste link or storage path, or leave empty if none"
              />
            </FormRow>

            <FormRow label="Elevator Permit Remarks">
              <TextInput
                name="elevator_permit_remarks"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Enter remarks, or leave empty if none"
              />
            </FormRow>
          </>
        )}

        {asBoolean(form.has_generator_permit) && (
          <>
            <FormRow label="Generator Permit Issue Date">
              <TextInput
                name="generator_issue_date"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Generator Permit Expiration Date">
              <TextInput
                name="generator_expiration_date"
                form={form}
                handleChange={handleFieldChange}
                type="date"
              />
            </FormRow>

            <FormRow label="Generator Permit File / Drive Location">
              <TextInput
                name="generator_permit_file_link"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Paste link or storage path, or leave empty if none"
              />
            </FormRow>

            <FormRow label="Generator Permit Remarks">
              <TextInput
                name="generator_permit_remarks"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Enter remarks, or leave empty if none"
              />
            </FormRow>
          </>
        )}
      </FormSection>

      <FormSection title="Utilities and Safety">
        <FormRow label="Available Utilities / Safety Features">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {utilityFields.map((item) => (
              <CheckboxInput
                key={item.name}
                name={item.name}
                label={item.label}
                form={form}
                setForm={setForm}
                clearFields={[item.detailName]}
              />
            ))}
          </div>
        </FormRow>

        {utilityFields.map(
          (item) =>
            asBoolean(form[item.name]) && (
              <FormRow key={item.detailName} label={`${item.label} Location on Plan / Remarks`}>
                <TextInput
                  name={item.detailName}
                  form={form}
                  handleChange={handleFieldChange}
                  placeholder="Enter location or remarks, or leave empty if none"
                />
              </FormRow>
            )
        )}
      </FormSection>

      <FormSection title="Environmental Compliance">
        <FormRow label="Compliance Requirements">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <CheckboxInput
              name="cmr_submission"
              label="CMR Submission"
              form={form}
              setForm={setForm}
              clearFields={["cmr_submission_remarks"]}
            />

            <CheckboxInput
              name="smr_submission"
              label="SMR Submission"
              form={form}
              setForm={setForm}
              clearFields={["smr_submission_remarks"]}
            />

            <CheckboxInput
              name="testing_requirements"
              label="Testing Requirements"
              form={form}
              setForm={setForm}
              clearFields={["testing_requirements_remarks"]}
            />
          </div>
        </FormRow>

        {asBoolean(form.cmr_submission) && (
          <FormRow label="CMR Submission Remarks">
            <TextInput
              name="cmr_submission_remarks"
              form={form}
              handleChange={handleFieldChange}
              placeholder="Enter remarks, or leave empty if none"
            />
          </FormRow>
        )}

        {asBoolean(form.smr_submission) && (
          <FormRow label="SMR Submission Remarks">
            <TextInput
              name="smr_submission_remarks"
              form={form}
              handleChange={handleFieldChange}
              placeholder="Enter remarks, or leave empty if none"
            />
          </FormRow>
        )}

        {asBoolean(form.testing_requirements) && (
          <FormRow label="Testing Requirements Remarks">
            <TextInput
              name="testing_requirements_remarks"
              form={form}
              handleChange={handleFieldChange}
              placeholder="Enter remarks, or leave empty if none"
            />
          </FormRow>
        )}
      </FormSection>

      <FormSection title="Attachments">
        <FormRow label="Attachment Status">
          <CheckboxInput
            name="has_attachment"
            label="Has Attachment"
            form={form}
            setForm={setForm}
            clearFields={["file_link"]}
          />
        </FormRow>

        {asBoolean(form.has_attachment) && (
          <FormRow label="File Link / Path">
            <div className="space-y-2">
              <TextInput
                name="file_link"
                form={form}
                handleChange={handleFieldChange}
                placeholder="Paste Google Drive link or file storage path, or leave empty if none"
              />

              {form.file_link?.trim() && (
                <a
                  href={form.file_link.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-medium text-upred underline underline-offset-4"
                >
                  Open current attachment
                </a>
              )}
            </div>
          </FormRow>
        )}
      </FormSection>

      <div className="sticky bottom-0 z-10 flex flex-wrap justify-center gap-3 border-t border-upred/10 bg-white/90 px-4 py-4 backdrop-blur-md">
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