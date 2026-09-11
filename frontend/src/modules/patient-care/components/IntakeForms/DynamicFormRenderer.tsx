import React, { useState } from 'react';
import { intakeFormsService } from '../../services/intake-forms.service';

interface DynamicFormRendererProps {
  formId: string;
  template: any;
  onFormSubmitted?: () => void;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  formId,
  template,
  onFormSubmitted,
}) => {
  const [formData, setFormData] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleNext = () => {
    if (currentSection < template.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await intakeFormsService.submitForm(formId, formData);
      onFormSubmitted?.();
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentSectionData = template.sections[currentSection];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all"
          style={{
            width: `${((currentSection + 1) / template.sections.length) * 100}%`,
          }}
        />
      </div>

      {/* Section Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {currentSectionData.titleAr || currentSectionData.title}
        </h3>
        {currentSectionData.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentSectionData.description}
          </p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {currentSectionData.fields.map((field: any) => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentSection === 0}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
        >
          السابق
        </button>
        {currentSection < template.sections.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            التالي
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'جارٍ الإرسال...' : 'إرسال'}
          </button>
        )}
      </div>
    </div>
  );
};

const FormField: React.FC<{
  field: any;
  value: any;
  onChange: (value: any) => void;
}> = ({ field, value, onChange }) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            dir="rtl"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            dir="rtl"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            dir="rtl"
          >
            <option value="">اختر...</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="mt-2 space-y-2">
            {field.options?.map((option: any) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const newValue = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) {
                      newValue.push(option.value);
                    } else {
                      const index = newValue.indexOf(option.value);
                      if (index > -1) {
                        newValue.splice(index, 1);
                      }
                    }
                    onChange(newValue);
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ms-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="mt-2 space-y-2">
            {field.options?.map((option: any) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="focus:ring-primary-500 text-primary-600"
                />
                <span className="ms-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.labelAr || field.label}
        {field.required && <span className="text-red-500 ms-1">*</span>}
      </label>
      {renderField()}
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
      )}
    </div>
  );
};

export default DynamicFormRenderer;
