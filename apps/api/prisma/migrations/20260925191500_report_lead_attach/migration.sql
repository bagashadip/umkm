DROP TRIGGER IF EXISTS planner_reports_immutable ON "PlannerReport";
DROP FUNCTION IF EXISTS prevent_planner_report_mutation();
DROP FUNCTION IF EXISTS prevent_planner_report_update();

CREATE FUNCTION prevent_planner_report_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."sessionId" IS DISTINCT FROM OLD."sessionId"
     OR NEW."status" IS DISTINCT FROM OLD."status"
     OR NEW."questionnaireVersion" IS DISTINCT FROM OLD."questionnaireVersion"
     OR NEW."pricingVersion" IS DISTINCT FROM OLD."pricingVersion"
     OR NEW."rawAnswers" IS DISTINCT FROM OLD."rawAnswers"
     OR NEW."normalizedAnswers" IS DISTINCT FROM OLD."normalizedAnswers"
     OR NEW."selectedFeatures" IS DISTINCT FROM OLD."selectedFeatures"
     OR NEW."excludedFeatures" IS DISTINCT FROM OLD."excludedFeatures"
     OR NEW."priceBreakdown" IS DISTINCT FROM OLD."priceBreakdown"
     OR NEW."prototypeConfig" IS DISTINCT FROM OLD."prototypeConfig"
     OR NEW."totalPrice" IS DISTINCT FROM OLD."totalPrice"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
  THEN
    RAISE EXCEPTION 'planner_reports snapshot is immutable after creation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER planner_reports_immutable
BEFORE UPDATE ON "PlannerReport"
FOR EACH ROW
EXECUTE FUNCTION prevent_planner_report_update();
