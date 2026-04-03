import React from "react";
import { ClientContact } from "../ContactBook/ClientContact";
import { PageHeader } from "../Common/PageHeader";
import { useModal } from "@/contexts/ModalManagerProvider";
import { MODAL_IDS } from "@/types/modal";
import { PrimaryButton } from "../Common/PrimaryButton";

const ClientContainer = () => {
  const { openModal } = useModal();

  return (
    <div className="w-full h-full p-5 flex flex-col items-start gap-4">
      <PageHeader
        icon="/sidebar/contact-book.svg"
        label="Client"
        button={
          <PrimaryButton
            text="Add client"
            icon="/misc/plus-icon.svg"
            iconPosition="left"
            onClick={() => openModal(MODAL_IDS.CREATE_CLIENT_CONTACT)}
            containerClassName="w-[140px]"
          />
        }
      />

      <ClientContact />
    </div>
  );
};

export default ClientContainer;
