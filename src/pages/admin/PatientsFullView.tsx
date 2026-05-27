import PatientsTriageView from '@/components/triagem/PatientsTriageView';

export default function PatientsFullView() {
  return <PatientsTriageView redirectOnDenied="/admin" />;
}
