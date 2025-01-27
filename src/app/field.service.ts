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
  providedIn: 'root',
})
export class FieldService {
  private fieldsSubject = new BehaviorSubject<Field[]>(this.loadFieldsFromLocalStorage());
  fields$ = this.fieldsSubject.asObservable();

  private formSubmittedSubject = new BehaviorSubject<boolean>(false);
  formSubmitted$ = this.formSubmittedSubject.asObservable();

  private successMessageSubject = new BehaviorSubject<string>('');
  successMessage$ = this.successMessageSubject.asObservable();

  constructor() {
    // Auto-save fields to local storage on any change
    this.fields$.subscribe(fields => this.saveFieldsToLocalStorage(fields));
  }

  // Generate a unique ID for fields
  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Add a new field to the form
  addField(type: string) {
    const newField: Field = {
      id: this.generateId(),
      type,
      label: '',
      placeholder: '',
      required: false,
      options: type === 'dropdown' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    this.fieldsSubject.next([...this.fieldsSubject.value, newField]);
  }

  // Remove a field by its ID
  removeField(id: string) {
    const updatedFields = this.fieldsSubject.value.filter(field => field.id !== id);
    this.fieldsSubject.next(updatedFields);
  }

  // Update field properties
  updateField(id: string, changes: Partial<Field>) {
    const updatedFields = this.fieldsSubject.value.map(field =>
      field.id === id ? { ...field, ...changes } : field
    );
    this.fieldsSubject.next(updatedFields);
  }

  // Clear all fields
  clearFields() {
    this.fieldsSubject.next([]); // Clear fields observable
    this.setFormSubmitted(false); // Reset form state
  }

  // Set form submitted state
  setFormSubmitted(value: boolean) {
    this.formSubmittedSubject.next(value);
  }

  // Set success message with timeout to reset
  setSuccessMessage(message: string) {
    this.successMessageSubject.next(message);
    setTimeout(() => {
      this.successMessageSubject.next('');
      this.setFormSubmitted(false);
    }, 3000);
  }

  // Load fields from local storage
  private loadFieldsFromLocalStorage(): Field[] {
    try {
      const storedFields = localStorage.getItem('dynamicFormFields');
      return storedFields ? JSON.parse(storedFields) : [];
    } catch (error) {
      console.error('Error loading fields from local storage:', error);
      return [];
    }
  }

  // Save fields to local storage
  private saveFieldsToLocalStorage(fields: Field[]): void {
    try {
      localStorage.setItem('dynamicFormFields', JSON.stringify(fields));
    } catch (error) {
      console.error('Error saving fields to local storage:', error);
    }
  }
}
