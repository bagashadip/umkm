CREATE OR REPLACE FUNCTION prevent_planner_report_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'planner_reports are immutable after creation';
END;
$$;

CREATE TRIGGER planner_reports_immutable
BEFORE UPDATE ON "PlannerReport"
FOR EACH ROW
EXECUTE FUNCTION prevent_planner_report_update();
