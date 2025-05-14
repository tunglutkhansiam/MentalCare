import { Search } from "lucide-react";

export function PatientSearchBar() {
  return (
    <div className="bg-orange-500 text-white p-3 flex items-center justify-between cursor-pointer">
      <div className="flex items-center w-full">
        <Search className="h-5 w-5 mr-2 text-white" />
        <span>Chat with Patient</span>
      </div>
    </div>
  );
}