import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Field {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  private fieldsSubject = new BehaviorSubject<Field[]>(this.loadFieldsFromLocalStorage());
  fields$ = this.fieldsSubject.asObservable();

  private formSubmittedSubject = new BehaviorSubject<boolean>(false); // Add this
  formSubmitted$ = this.formSubmittedSubject.asObservable();           // Add this

  private successMessageSubject = new BehaviorSubject<string>('');    // Add this
  successMessage$ = this.successMessageSubject.asObservable();         // Add this

  constructor() {
    this.fields$.subscribe(fields => this.saveFieldsToLocalStorage(fields));
  }

  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  addField(type: string) {
    const newField: Field = {
      id: this.generateId(),
      type,
      label: '',
      placeholder: '',
      required: false,
      options: type === 'dropdown' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };
    this.fieldsSubject.next([...this.fieldsSubject.value, newField]);
  }

  removeField(id: string) {
    const updatedFields = this.fieldsSubject.value.filter(field => field.id !== id);
    this.fieldsSubject.next(updatedFields);
  }

  updateField(id: string, changes: Partial<Field>) {
    const updatedFields = this.fieldsSubject.value.map(field =>
      field.id === id ? { ...field, ...changes } : field
    );
    this.fieldsSubject.next(updatedFields);
  }

  setFormSubmitted(value: boolean) {         // Add this
    this.formSubmittedSubject.next(value);
  }

  setSuccessMessage(message: string) {      // Add this
    this.successMessageSubject.next(message);
    setTimeout(() => {
      this.successMessageSubject.next('');
      this.setFormSubmitted(false);
    }, 3000);
  }

  private loadFieldsFromLocalStorage(): Field[] {
    try {
      const storedFields = localStorage.getItem('dynamicFormFields');
      return storedFields ? JSON.parse(storedFields) : [];
    } catch (error) {
      console.error("Error loading fields from local storage:", error);
      return [];
    }
  }

  private saveFieldsToLocalStorage(fields: Field[]): void {
    try {
      localStorage.setItem('dynamicFormFields', JSON.stringify(fields));
    } catch (error) {
      console.error("Error saving fields to local storage:", error);
    }
  }
}