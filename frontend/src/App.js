import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('add');
  const [configId, setConfigId] = useState('');
  const [message, setMessage] = useState(null);
  const [configDetails, setConfigDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [yamlValidationResult, setYamlValidationResult] = useState(null);

  // Base URL for API - use deployed backend URL or fallback to localhost for development
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://schema-validator.onrender.com/';

  // Form validation schema using Yup
  const ConfigSchema = Yup.object().shape({
    name: Yup.string()
    .matches(/^[A-Za-z\s]+$/, "Name must contain only letters")
    .required('Name is required'),
    age: Yup.number().min(0, 'Age must be a positive number').required('Age is required'),
    email: Yup.string().email('Invalid email format').required('Email is required'),
    is_active: Yup.boolean(),
    hobbies: Yup.string(),
    street: Yup.string(),
    city: Yup.string()
    .matches(/^[A-Za-z\s]*$/, "City must contain only letters"),
    zip_code: Yup.string()
  });

  // Initial form values
  const initialValues = {
    name: '',
    age: '',
    email: '',
    is_active: false,
    hobbies: '',
    street: '',
    city: '',
    zip_code: ''
  };

  // Handle form submission - Add Configuration
  const handleAddConfig = async (values, { resetForm, setSubmitting }) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/configs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Configuration added successfully with ID: ${data.id}` });
        resetForm();
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to add configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  // Fetch configuration details
  const fetchConfig = async () => {
    if (!configId) {
      setMessage({ type: 'error', text: 'Please enter a configuration ID' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setConfigDetails(null);

    try {
      const response = await fetch(`${API_BASE_URL}/configs/${configId}`);
      const data = await response.json();

      if (response.ok) {
        setConfigDetails(data);
      } else {
        setMessage({ type: 'error', text: data.detail || 'Configuration not found' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Update configuration
  const handleUpdateConfig = async (values, { setSubmitting }) => {
    if (!configId) {
      setMessage({ type: 'error', text: 'Please enter a configuration ID' });
      setSubmitting(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration updated successfully' });
        setConfigDetails(data);
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to update configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  // Delete configuration
  const handleDeleteConfig = async () => {
    if (!configId) {
      setMessage({ type: 'error', text: 'Please enter a configuration ID' });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/configs/${configId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Configuration deleted successfully' });
        setConfigDetails(null);
        setConfigId('');
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to delete configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle YAML file validation
  const handleYamlValidation = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setYamlValidationResult(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/validate`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setYamlValidationResult(result);
    } catch (error) {
      setMessage({ type: 'error', text: `Error validating YAML: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Format hobbies for display
  const formatHobbies = (hobbies) => {
    if (!hobbies || !Array.isArray(hobbies)) return '';
    return hobbies.join(', ');
  };

  return (
    <div className="app-container">
      <header>
        <h1>Configuration Management System</h1>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'add' ? 'active' : ''} 
          onClick={() => setActiveTab('add')}
        >
          Add Configuration
        </button>
        <button 
          className={activeTab === 'view' ? 'active' : ''} 
          onClick={() => setActiveTab('view')}
        >
          View/Update/Delete
        </button>
        <button 
          className={activeTab === 'validate' ? 'active' : ''} 
          onClick={() => setActiveTab('validate')}
        >
          Validate YAML
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {isLoading && <div className="loading">Loading...</div>}

      {activeTab === 'add' && (
        <div className="form-section">
          <h2>Add New Configuration</h2>
          <Formik
            initialValues={initialValues}
            validationSchema={ConfigSchema}
            onSubmit={handleAddConfig}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <Field type="text" name="name" id="name" />
                  <ErrorMessage name="name" component="div" className="error" />
                </div>

                <div className="form-group">
                  <label htmlFor="age">Age *</label>
                  <Field type="number" name="age" id="age" min="0" />
                  <ErrorMessage name="age" component="div" className="error" />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <Field type="email" name="email" id="email" />
                  <ErrorMessage name="email" component="div" className="error" />
                </div>

                <div className="form-group checkbox">
                  <label>
                    <Field type="checkbox" name="is_active" />
                    Active
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="hobbies">Hobbies (comma-separated)</label>
                  <Field type="text" name="hobbies" id="hobbies" />
                </div>

                <h3>Address (Optional)</h3>
                <div className="form-group">
                  <label htmlFor="street">Street</label>
                  <Field type="text" name="street" id="street" />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <Field type="text" name="city" id="city" />
                </div>

                <div className="form-group">
                  <label htmlFor="zip_code">ZIP Code</label>
                  <Field type="text" name="zip_code" id="zip_code" />
                </div>

                <button type="submit" disabled={isSubmitting || isLoading}>
                  Add Configuration
                </button>
              </Form>
            )}
          </Formik>
        </div>
      )}

      {activeTab === 'view' && (
        <div className="form-section">
          <h2>Manage Configuration</h2>
          <div className="id-section">
            <input
              type="number"
              placeholder="Enter Configuration ID"
              value={configId}
              onChange={(e) => setConfigId(e.target.value)}
            />
            <button onClick={fetchConfig} disabled={isLoading}>Fetch</button>
          </div>

          {configDetails && (
            <div className="config-details">
              <h3>Configuration Details</h3>
              <Formik
                initialValues={{
                  name: configDetails.name || '',
                  age: configDetails.age || '',
                  email: configDetails.email || '',
                  is_active: configDetails.is_active || false,
                  hobbies: formatHobbies(configDetails.hobbies),
                  street: configDetails.street || '',
                  city: configDetails.city || '',
                  zip_code: configDetails.zip_code || ''
                }}
                validationSchema={ConfigSchema}
                onSubmit={handleUpdateConfig}
                enableReinitialize
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="form-group">
                      <label htmlFor="update-name">Name *</label>
                      <Field type="text" name="name" id="update-name" />
                      <ErrorMessage name="name" component="div" className="error" />
                    </div>

                    <div className="form-group">
                      <label htmlFor="update-age">Age *</label>
                      <Field type="number" name="age" id="update-age" min="0" />
                      <ErrorMessage name="age" component="div" className="error" />
                    </div>

                    <div className="form-group">
                      <label htmlFor="update-email">Email *</label>
                      <Field type="email" name="email" id="update-email" />
                      <ErrorMessage name="email" component="div" className="error" />
                    </div>

                    <div className="form-group checkbox">
                      <label>
                        <Field type="checkbox" name="is_active" />
                        Active
                      </label>
                    </div>

                    <div className="form-group">
                      <label htmlFor="update-hobbies">Hobbies (comma-separated)</label>
                      <Field type="text" name="hobbies" id="update-hobbies" />
                    </div>

                    <h3>Address (Optional)</h3>
                    <div className="form-group">
                      <label htmlFor="update-street">Street</label>
                      <Field type="text" name="street" id="update-street" />
                    </div>

                    <div className="form-group">
                      <label htmlFor="update-city">City</label>
                      <Field type="text" name="city" id="update-city" />
                    </div>

                    <div className="form-group">
                      <label htmlFor="update-zip_code">ZIP Code</label>
                      <Field type="text" name="zip_code" id="update-zip_code" />
                    </div>

                    <div className="button-group">
                      <button type="submit" disabled={isSubmitting || isLoading}>
                        Update Configuration
                      </button>
                      <button 
                        type="button" 
                        className="delete-button"
                        onClick={handleDeleteConfig}
                        disabled={isLoading}
                      >
                        Delete Configuration
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </div>
      )}

      {activeTab === 'validate' && (
        <div className="form-section">
          <h2>Validate YAML File</h2>
          <div className="file-upload">
            <input 
              type="file" 
              accept=".yaml,.yml" 
              onChange={handleYamlValidation}
              disabled={isLoading}
            />
            <p className="note">Upload a YAML file to validate against the schema</p>
          </div>

          {yamlValidationResult && (
            <div className={`validation-result ${yamlValidationResult.is_valid ? 'valid' : 'invalid'}`}>
              <h3>Validation Result</h3>
              <p>{yamlValidationResult.is_valid ? yamlValidationResult.message : yamlValidationResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;