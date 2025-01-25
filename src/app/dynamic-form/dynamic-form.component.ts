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

  constructor(private fieldService: FieldService) { }

  ngOnInit() {
    this.fieldsSubscription = this.fieldService.fields$.subscribe(fields => {
      this.fields = fields;
      this.rebuildForm();
    });
    this.formSubmittedSubscription = this.fieldService.formSubmitted$.subscribe(submitted => this.submitted = submitted);
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
    const regex = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|,(?=(?:[^"]*"[^"]*")*(?![^"]*"))/g;
    const options = value ? value.split(regex).map(option => option.trim()).filter(option => option !== "") : [];
    this.updateField(field, { options });
    this.rebuildForm();
  }

  rebuildForm() {
    this.form = new FormGroup({});
    this.fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      this.form.addControl(field.id, new FormControl('', validators));
    });
  }

  onSubmit() {
    this.fieldService.setFormSubmitted(true);
    if (this.form.valid) {
        const formData = this.form.value;
        const output: string[] = []; // Explicitly define output as a string array

        this.fields.forEach(field => {
            if (formData.hasOwnProperty(field.id)) {
                let answer = formData[field.id];
                if (field.type === 'checkbox') {
                    answer = answer ? 'Yes' : 'No';
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