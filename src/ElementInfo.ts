export interface ElementInfo {
  tagName: string;
  class: string;
  type: string;
  value: string;
  name: string;
  formcontrolname: string | null;
  options: { value: string; text: string; selected: boolean }[];
  targetIndex: number;
}
