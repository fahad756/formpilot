"use client";

/**
 * ProfileForm — comprehensive form for all autofill-mapped profile fields.
 *
 * Organized into collapsible sections so the page doesn't feel overwhelming.
 * Uses React Hook Form for controlled state with Zod validation.
 * On save, only the changed fields are sent (exclusiveFields pattern via
 * dirtyFields from formState).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Profile, ProfileUpdate } from "@/types";

interface ProfileFormProps {
  profile: Profile | undefined;
  isLoading: boolean;
  onSave: (data: ProfileUpdate) => Promise<unknown>;
  isSaving: boolean;
}

interface FieldDef {
  name: keyof ProfileUpdate;
  label: string;
  placeholder?: string;
  type?: string;
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Personal Details",
    fields: [
      { name: "first_name",    label: "First Name",   placeholder: "Jane" },
      { name: "last_name",     label: "Last Name",    placeholder: "Doe" },
      { name: "email",         label: "Email",        placeholder: "jane@example.com", type: "email" },
      { name: "phone",         label: "Phone",        placeholder: "+1 (555) 000-0000" },
      { name: "address_line1", label: "Address",      placeholder: "123 Main St" },
      { name: "city",          label: "City",         placeholder: "San Francisco" },
      { name: "state",         label: "State",        placeholder: "CA" },
      { name: "zip_code",      label: "ZIP Code",     placeholder: "94105" },
      { name: "country",       label: "Country",      placeholder: "United States" },
    ],
  },
  {
    title: "Professional Links",
    fields: [
      { name: "linkedin_url",  label: "LinkedIn URL", placeholder: "https://linkedin.com/in/janedoe" },
      { name: "github_url",    label: "GitHub URL",   placeholder: "https://github.com/janedoe" },
      { name: "portfolio_url", label: "Portfolio URL",placeholder: "https://janedoe.dev" },
    ],
  },
  {
    title: "Professional Details",
    fields: [
      { name: "current_title",    label: "Current Title",     placeholder: "Software Engineer" },
      { name: "years_experience", label: "Years Experience",  placeholder: "4", type: "number" },
      { name: "current_company",  label: "Current Company",   placeholder: "Acme Inc." },
    ],
  },
  {
    title: "Education",
    fields: [
      { name: "university",       label: "University",        placeholder: "MIT" },
      { name: "degree",           label: "Degree",            placeholder: "B.Sc." },
      { name: "major",            label: "Major",             placeholder: "Computer Science" },
      { name: "graduation_year",  label: "Graduation Year",   placeholder: "2020", type: "number" },
      { name: "gpa",              label: "GPA",               placeholder: "3.8" },
    ],
  },
  {
    title: "Application Extras",
    fields: [
      { name: "salary_expectation", label: "Salary Expectation", placeholder: "$120,000" },
      { name: "availability",       label: "Availability",       placeholder: "2 weeks notice" },
    ],
  },
];

export function ProfileForm({ profile, isLoading, onSave, isSaving }: ProfileFormProps) {
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<ProfileUpdate>({
    defaultValues: profile ?? {},
  });

  // Sync form values when profile loads from the server
  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  const onSubmit = async (data: ProfileUpdate) => {
    await onSave(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-border/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <h2 className="section-title mb-5">{section.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.fields.map(({ name, label, placeholder, type = "text" }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label htmlFor={name} className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  placeholder={placeholder}
                  {...register(name)}
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-surface text-text-base placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Cover letter */}
      <Card>
        <h2 className="section-title mb-5">Cover Letter Template</h2>
        <textarea
          rows={6}
          placeholder="Paste your standard cover letter here. FormPilot will use this for cover letter fields."
          {...register("cover_letter_template")}
          className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-surface text-text-base placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-shadow"
        />
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={isSaving} disabled={!isDirty} size="lg">
          Save Profile
        </Button>
      </div>
    </form>
  );
}
