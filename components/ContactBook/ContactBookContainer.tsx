import React from "react";
import { EmployeeContact } from "./EmployeeContact";
import { createShapeElement } from "../Common/ToolTip/ShapeSelectionTooltip";
import { CategoryShapeEnum } from "@qash/types/enums";
import { PageHeader } from "../Common/PageHeader";
import { useModal } from "@/contexts/ModalManagerProvider";
import { MODAL_IDS } from "@/types/modal";
import { PrimaryButton } from "../Common/PrimaryButton";

export const CategoryTab = ({ label }: { label: React.ReactNode }) => {
  return (
    <div className="flex flex-row items-center justify-center gap-2 h-10">
      <img src="/misc/category-icon.svg" alt="category" className="w-5 h-5" />
      <span className="text-text-primary truncate">{label}</span>
    </div>
  );
};

export const CategoryBadge = ({ shape, color, name }: { shape: CategoryShapeEnum; color: string; name: string }) => {
  if (name === "Client") {
    return <span className="font-semibold text-[#F5A623]">{name}</span>;
  }

  return (
    <div
      className={`flex flex-row items-center justify-center gap-3 px-3 py-1 rounded-full border w-fit`}
      style={{ borderColor: color, backgroundColor: `${color}20` }}
    >
      {createShapeElement(shape, color)}
      <span className="-mt-0.5 font-semibold truncate" style={{ color: color }}>
        {name}
      </span>
    </div>
  );
};

const ContactBookContainer = () => {
  const { openModal } = useModal();

  return (
    <div className="w-full h-full p-5 flex flex-col items-start gap-4">
      <PageHeader
        icon="/sidebar/contact-book.svg"
        label="Employee"
        button={
          <PrimaryButton
            text="Add employee"
            icon="/misc/plus-icon.svg"
            iconPosition="left"
            onClick={() => openModal(MODAL_IDS.CREATE_EMPLOYEE_CONTACT)}
            containerClassName="w-[160px]"
          />
        }
      />

      <EmployeeContact />
    </div>
  );
};

export default ContactBookContainer;
