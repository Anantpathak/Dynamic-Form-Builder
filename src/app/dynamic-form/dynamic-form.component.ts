import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { FieldService, Field } from '../field.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnDestroy {
  availableFieldTypes = ['text', 'textarea', 'dropdown', 'checkbox', 'radio'];
  fields: Field[] = [];
  form: FormGroup = new FormGroup({});
  submitted = false;
  successMessage = '';

  private fieldsSubscription: Subscription = new Subscription();
  private formSubmittedSubscription: Subscription = new Subscription();
  private successMessageSubscription: Subscription = new Subscription();

  constructor(private fieldService: FieldService) {}

  ngOnInit() {
    // Subscribe to fields and update form controls
    this.fieldsSubscription = this.fieldService.fields$.subscribe(fields => {
      this.fields = fields;
      this.rebuildForm();
    });

    // Subscribe to form submission status
    this.formSubmittedSubscription = this.fieldService.formSubmitted$.subscribe(submitted => this.submitted = submitted);

    // Subscribe to success message
    this.successMessageSubscription = this.fieldService.successMessage$.subscribe(message => this.successMessage = message);
  }

  addField(type: string) {
    this.fieldService.addField(type);
  }

  removeField(field: Field) {
    this.fieldService.removeField(field.id);
  }

  updateField(field: Field, changes: Partial<Field>) {
    this.fieldService.updateField(field.id, changes);
  }

  updateOptions(field: Field, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const options = value ? value.split(',').map(option => option.trim()).filter(option => option !== "") : [];
    this.updateField(field, { options });
    this.rebuildForm();
  }

  rebuildForm() {
    this.form = new FormGroup({});
    this.fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];

      // Initialize checkboxes with an empty array by default (no checkboxes selected by default)
      if (field.type === 'checkbox') {
        // Ensure formControl is initialized with an empty array for checkboxes
        this.form.addControl(field.id, new FormControl([])); 
      } else {
        this.form.addControl(field.id, new FormControl('', validators));
      }
    });
    console.log(this.form.value);  // Debugging the form value to ensure correct initialization
  }

  onSubmit() {
    this.fieldService.setFormSubmitted(true);
    if (this.form.valid) {
      const formData = this.form.value;
      const output: string[] = [];

      this.fields.forEach(field => {
        if (formData.hasOwnProperty(field.id)) {
          let answer = formData[field.id];
          if (field.type === 'checkbox') {
            answer = answer.join(', ');  // Convert selected checkbox values to a comma-separated string
          }
          output.push(`${field.label}: ${answer}`);
        }
      });

      console.log('Form submitted:');
      output.forEach(item => console.log(item));
      this.fieldService.setSuccessMessage('Form submitted successfully!');
      this.form.reset();
    }
  }

  ngOnDestroy(): void {
    this.fieldsSubscription.unsubscribe();
    this.formSubmittedSubscription.unsubscribe();
    this.successMessageSubscription.unsubscribe();
  }
}
