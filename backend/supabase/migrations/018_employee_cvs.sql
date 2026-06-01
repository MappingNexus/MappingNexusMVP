CREATE TABLE IF NOT EXISTS public.employee_cvs (
    employee_id uuid PRIMARY KEY REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    file_data_base64 text NOT NULL,
    uploaded_by uuid REFERENCES public.users(user_id) ON DELETE SET NULL,
    uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_cvs_company_id
    ON public.employee_cvs(company_id);
