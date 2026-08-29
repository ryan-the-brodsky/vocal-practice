import { Redirect } from 'expo-router';

// The "Plan" tab was renamed "Routine" (route /routine, file routine.tsx) on
// 2026-08-29. This stub only catches legacy /plan links and forwards them.
export default function PlanRedirect() {
  return <Redirect href="/routine" />;
}
