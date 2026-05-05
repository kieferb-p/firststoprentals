export interface Attachment {
  id: string;
  name: string;
  dayPrice: string;
  weekPrice: string;
  monthPrice: string;
}

export interface EquipmentItem {
   id: string;
   category: string;
   additionalCategories?: string[];
   name: string;
   imageUrl: string;
   dayPrice: string;
   weekPrice: string;
   monthPrice: string;
   notes: string;
   attachments?: Attachment[];
}
