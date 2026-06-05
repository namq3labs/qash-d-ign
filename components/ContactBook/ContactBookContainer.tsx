import React from "react";
import { EmployeeContact } from "./EmployeeContact";
import { CategoryShapeEnum } from "@qash/types/enums";
import { PageHeader } from "../Common/PageHeader";
import { useModal } from "@/contexts/ModalManagerProvider";
import { MODAL_IDS } from "@/types/modal";
import { PrimaryButton } from "../Common/PrimaryButton";

export const CategoryTab = ({ label }: { label: React.ReactNode }) => {
  return <span className="truncate">{label}</span>;
};

export const CategoryBadge = ({ shape, color, name }: { shape: CategoryShapeEnum; color: string; name: string }) => {
  if (name === "Client") {
    return <span className="font-semibold text-[#F5A623]">{name}</span>;
  }

  return (
    <div
      className="flex flex-row items-center justify-center px-2.5 py-1 rounded-full border w-fit"
      style={{ borderColor: color, backgroundColor: `${color}20` }}
    >
      <span className="font-medium text-xs truncate" style={{ color: color }}>
        {name}
      </span>
    </div>
  );
};

const ContactBookContainer = () => {
  const { openModal } = useModal();

  return (
    <div className="w-full h-full flex flex-col">
      {/* Page header (heading + subtitle + action), same structure as the Dashboard */}
      <div className="w-full flex items-start justify-between gap-4 px-6 pt-6 pb-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text-primary">Employee</h1>
          <p className="text-[14px] text-text-secondary">Manage your team members and their payment schedules.</p>
        </div>
        <PrimaryButton
          text="Add employee"
          icon="/misc/plus-icon.svg"
          iconPosition="left"
          onClick={() => openModal(MODAL_IDS.CREATE_EMPLOYEE_CONTACT)}
          containerClassName="w-[160px]"
        />
      </div>

      <EmployeeContact />
    </div>
  );
};

export default ContactBookContainer;
