export interface FieldDef {
  label: string;
  type: string;
  defaultValue: string;
  items: string[];
}

export interface FormConfig {
  itemSeparator: string;
  separator: string;
  fields: FieldDef[];
}

export interface ListConfig {
  columns: string[];
}

export interface AlertConfig {
  text: string;
}