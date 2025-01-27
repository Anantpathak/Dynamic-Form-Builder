import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators,AbstractControl  } from '@angular/forms';
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
    private subscriptions: Subscription[] = [];

    constructor(private fieldService: FieldService) { }

    ngOnInit() {
        this.subscriptions.push(
            this.fieldService.fields$.subscribe(fields => {
                this.fields = fields;
                this.rebuildForm();
            })
        );
        this.subscriptions.push(
            this.fieldService.formSubmitted$.subscribe(submitted => this.submitted = submitted)
        );
        this.subscriptions.push(
            this.fieldService.successMessage$.subscribe(message => this.successMessage = message)
        );
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
        this.rebuildForm();//Keep this
    }

    rebuildForm() {
        this.form = new FormGroup({});
        this.fields.forEach(field => {
            const validators = field.required ? [Validators.required] : [];

            if (field.type === 'checkbox' && field.options) {
                const formArray = new FormArray(field.options.map(() => new FormControl(false)));
                if (field.required) {
                    formArray.setValidators([this.minSelectedCheckboxes(1)]);
                }
                this.form.addControl(field.id, formArray);
            } else {
                this.form.addControl(field.id, new FormControl('', validators));
            }
        });
    }

    minSelectedCheckboxes(min = 1) {
      return (control: AbstractControl): { [key: string]: any } | null => {
          if (control instanceof FormArray) {
              const formArray = control as FormArray;
              const totalSelected = formArray.controls
                  .map(ctrl => ctrl.value)
                  .reduce((prev, next) => next ? prev + 1 : prev, 0);
              return totalSelected >= min ? null : { required: true };
          }
          return null;
      };
  }

    onCheckboxChange(fieldId: string, option: string, event: Event) {
        const formArray = this.form.get(fieldId) as FormArray;
        const index = this.fields.find(f => f.id === fieldId)?.options?.indexOf(option);
        if (index !== undefined && event.target instanceof HTMLInputElement) {
          formArray.at(index).setValue(event.target.checked);
        }
    }

    onSubmit() {
      this.fieldService.setFormSubmitted(true);
  
      if (this.form.valid) {
          const formData = this.form.value;
          const output: string[] = [];
  
          this.fields.forEach(field => { // Use the fields array
              if (formData.hasOwnProperty(field.id)) {
                  let answer = formData[field.id];
  
                  if (Array.isArray(answer)) {
                      answer = answer.length > 0 ? answer.join(', ') : 'None selected';
                  }
  
                  output.push(`${field.label}: ${answer}`); // Use field.label here
              }
          });
  
          console.log('Form submitted:');
          output.forEach(item => console.log(item));
  
          this.fieldService.setSuccessMessage('Form submitted successfully!');
          this.form.reset();
          this.fields.forEach(field => {
              if (field.type === 'checkbox' && this.form.get(field.id)) {
                  const formArray = this.form.get(field.id) as FormArray;
                  formArray.clear();
                  if (field.options) {
                      field.options.forEach(() => formArray.push(new FormControl(false)));
                  }
              }
          });
          this.submitted = false;
          setTimeout(() => this.successMessage = '', 3000);
      }
  }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
    parseStyle(styleString: string): { [key: string]: string } | undefined {
        try {
            const styles: { [key: string]: string } = {};
            styleString.split(';').forEach(style => {
                const parts = style.split(':');
                if (parts.length === 2) {
                    styles[parts[0].trim()] = parts[1].trim();
                }
            });
            return Object.keys(styles).length > 0 ? styles : undefined;
        } catch (error) {
            console.error("Invalid style string", error);
            return undefined;
        }
    }
    styleString(styles: { [key: string]: string }): string{
        return Object.entries(styles).map(([key, value]) => `${key}:${value}`).join(';');
    }
    parseConditionalLogic(conditionalString: string): { fieldId: string; value: any; action: 'show' | 'hide' } | undefined {
        try {
            const parts = conditionalString.split(':');
            if (parts.length === 3) {
                return { fieldId: parts[0], value: parts[1], action: parts[2] as 'show' | 'hide' };
            }
            return undefined;
        } catch (error) {
            console.error("Invalid conditional logic string", error);
            return undefined;
        }
    }
    conditionalLogicString(conditionalLogic: { fieldId: string; value: any; action: 'show' | 'hide' }): string{
        if(conditionalLogic){
            return `${conditionalLogic.fieldId}:${conditionalLogic.value}:${conditionalLogic.action}`;
        }
        return "";
    }
}