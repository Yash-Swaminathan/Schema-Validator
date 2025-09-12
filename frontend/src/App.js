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
  const [comparisonResult, setComparisonResult] = useState(null);
  const [schema1Content, setSchema1Content] = useState('');
  const [schema2Content, setSchema2Content] = useState('');
  const [schema1Name, setSchema1Name] = useState('');
  const [schema2Name, setSchema2Name] = useState('');

  // Base URL for API - use deployed backend URL or fallback to localhost for development
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://schema-validator-131079022184.northamerica-northeast2.run.app';

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

  // Handle schema comparison with text input
  const handleSchemaComparison = async () => {
    if (!schema1Content.trim() || !schema2Content.trim()) {
      setMessage({ type: 'error', text: 'Please provide both schema contents' });
      return;
    }

    setIsLoading(true);
    setComparisonResult(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/compare-schemas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema1_content: schema1Content,
          schema2_content: schema2Content,
          schema1_name: schema1Name || 'Schema 1',
          schema2_name: schema2Name || 'Schema 2'
        })
      });

      const result = await response.json();
      setComparisonResult(result);
    } catch (error) {
      setMessage({ type: 'error', text: `Error comparing schemas: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle schema comparison with file upload
  const handleSchemaFileComparison = async (event) => {
    const files = event.target.files;
    if (files.length !== 2) {
      setMessage({ type: 'error', text: 'Please select exactly 2 files' });
      return;
    }

    setIsLoading(true);
    setComparisonResult(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('file1', files[0]);
    formData.append('file2', files[1]);

    try {
      const response = await fetch(`${API_BASE_URL}/compare-schema-files`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setComparisonResult(result);
    } catch (error) {
      setMessage({ type: 'error', text: `Error comparing schema files: ${error.message}` });
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
        <div className="header-content">
          <div>
            <h1>Schema Validator</h1>
            <p className="subtitle">Validate YAML against JSON Schema, compare files, manage configurations</p>
          </div>
        </div>
      </header>

      <div className="nav-tabs">
        <div className="nav-tabs-content">
          <button 
            className={activeTab === 'add' ? 'active' : ''} 
            onClick={() => setActiveTab('add')}
          >
            Add Config
          </button>
          <button 
            className={activeTab === 'view' ? 'active' : ''} 
            onClick={() => setActiveTab('view')}
          >
            Manage
          </button>
          <button 
            className={activeTab === 'validate' ? 'active' : ''} 
            onClick={() => setActiveTab('validate')}
          >
            Validate
          </button>
          <button 
            className={activeTab === 'compare-text' ? 'active' : ''} 
            onClick={() => setActiveTab('compare-text')}
          >
            Compare
          </button>
          <button 
            className={activeTab === 'compare-files' ? 'active' : ''} 
            onClick={() => setActiveTab('compare-files')}
          >
            Compare Files
          </button>
        </div>
      </div>

      <main>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {isLoading && <div className="loading">Loading...</div>}

      {activeTab === 'add' && (
        <div className="content-section">
          <div className="card">
            <h2>Add New Configuration</h2>
            <p className="description">Create a new configuration entry in the database</p>
          <Formik
            initialValues={initialValues}
            validationSchema={ConfigSchema}
            onSubmit={handleAddConfig}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <Field type="text" name="name" id="name" placeholder="John Doe" />
                  <p className="help-text">Full name using letters and spaces only</p>
                  <ErrorMessage name="name" component="div" className="error" />
                </div>

                <div className="two-column-grid">
                  <div className="form-group">
                    <label htmlFor="age">Age *</label>
                    <Field type="number" name="age" id="age" min="0" placeholder="25" />
                    <p className="help-text">Must be 0 or greater</p>
                    <ErrorMessage name="age" component="div" className="error" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <Field type="email" name="email" id="email" placeholder="john@example.com" />
                    <p className="help-text">Valid email address</p>
                    <ErrorMessage name="email" component="div" className="error" />
                  </div>
                </div>

                <div className="form-group checkbox">
                  <label>
                    <Field type="checkbox" name="is_active" />
                    Active user account
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="hobbies">Hobbies</label>
                  <Field type="text" name="hobbies" id="hobbies" placeholder="reading, coding, hiking" />
                  <p className="help-text">Comma-separated list of interests</p>
                </div>

                <h3>Address Information</h3>
                <div className="two-column-grid">
                  <div className="form-group">
                    <label htmlFor="street">Street</label>
                    <Field type="text" name="street" id="street" placeholder="123 Main St" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <Field type="text" name="city" id="city" placeholder="San Francisco" />
                    <p className="help-text">Letters and spaces only</p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="zip_code">ZIP Code</label>
                  <Field type="text" name="zip_code" id="zip_code" placeholder="94105" />
                </div>

                <button type="submit" disabled={isSubmitting || isLoading}>
                  Add Configuration
                </button>
              </Form>
            )}
          </Formik>
          </div>
        </div>
      )}

      {activeTab === 'view' && (
        <div className="content-section">
          <div className="card">
            <h2>Manage Configuration</h2>
            <p className="description">Find, update, or delete existing configurations</p>
            <div className="id-section">
              <input
                type="number"
                placeholder="Enter configuration ID (e.g. 1, 2, 3)"
                value={configId}
                onChange={(e) => setConfigId(e.target.value)}
              />
              <button onClick={fetchConfig} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Find Config'}
              </button>
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
        </div>
      )}

      {activeTab === 'validate' && (
        <div className="content-section">
          <div className="card">
            <h2>Validate YAML File</h2>
            <p className="description">Check if your YAML file matches the expected schema</p>
            <div className="file-upload">
              <input 
                type="file" 
                accept=".yaml,.yml" 
                onChange={handleYamlValidation}
                disabled={isLoading}
              />
              <p className="note">Select a .yaml or .yml file from your computer</p>
            </div>

            {yamlValidationResult && (
              <div className={`validation-result ${yamlValidationResult.is_valid ? 'valid' : 'invalid'}`}>
                <h3>Validation Result</h3>
                <p>{yamlValidationResult.is_valid ? yamlValidationResult.message : yamlValidationResult.error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'compare-text' && (
        <div className="content-section">
          <div className="card">
            <h2>Compare YAML Schemas</h2>
            <p className="description">Paste two YAML schemas to see their differences</p>
          
          <div className="schema-comparison">
            <div className="schema-input-group">
              <div className="schema-input">
                <label htmlFor="schema1-name">Schema 1 Name</label>
                <input
                  type="text"
                  id="schema1-name"
                  placeholder="Development Config"
                  value={schema1Name}
                  onChange={(e) => setSchema1Name(e.target.value)}
                />
                
                <label htmlFor="schema1-content">Schema 1 Content *</label>
                <textarea
                  id="schema1-content"
                  placeholder={`name: MyApp
version: 1.0.0
settings:
  debug: true
  port: 3000`}
                  value={schema1Content}
                  onChange={(e) => setSchema1Content(e.target.value)}
                  rows="8"
                />
              </div>
              
              <div className="schema-input">
                <label htmlFor="schema2-name">Schema 2 Name</label>
                <input
                  type="text"
                  id="schema2-name"
                  placeholder="Production Config"
                  value={schema2Name}
                  onChange={(e) => setSchema2Name(e.target.value)}
                />
                
                <label htmlFor="schema2-content">Schema 2 Content *</label>
                <textarea
                  id="schema2-content"
                  placeholder={`name: MyApp
version: 1.0.1
settings:
  debug: false
  port: 8080`}
                  value={schema2Content}
                  onChange={(e) => setSchema2Content(e.target.value)}
                  rows="8"
                />
              </div>
            </div>
            
            <div className="comparison-actions">
              <button onClick={handleSchemaComparison} disabled={isLoading}>
                Compare Schemas
              </button>
              <button 
                type="button" 
                className="clear-button"
                onClick={() => {
                  setSchema1Content('');
                  setSchema2Content('');
                  setSchema1Name('');
                  setSchema2Name('');
                  setComparisonResult(null);
                  setMessage(null);
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          {comparisonResult && (
            <div className="comparison-result">
              <h3>Comparison Result</h3>
              <div className={`result-summary ${comparisonResult.are_identical ? 'identical' : 'different'}`}>
                <div className="result-header">
                  <span className="schema-names">
                    {comparisonResult.schema1_name} vs {comparisonResult.schema2_name}
                  </span>
                  <span className={`result-badge ${comparisonResult.are_identical ? 'identical' : 'different'}`}>
                    {comparisonResult.are_identical ? '✓ Identical' : '⚠ Different'}
                  </span>
                </div>
              </div>

              <div className="validation-status">
                <div className={`schema-status ${comparisonResult.schema1_valid ? 'valid' : 'invalid'}`}>
                  <strong>{comparisonResult.schema1_name}:</strong> 
                  {comparisonResult.schema1_valid ? ' Valid YAML' : ' Invalid YAML'}
                  {comparisonResult.schema1_errors && (
                    <ul className="error-list">
                      {comparisonResult.schema1_errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={`schema-status ${comparisonResult.schema2_valid ? 'valid' : 'invalid'}`}>
                  <strong>{comparisonResult.schema2_name}:</strong> 
                  {comparisonResult.schema2_valid ? ' Valid YAML' : ' Invalid YAML'}
                  {comparisonResult.schema2_errors && (
                    <ul className="error-list">
                      {comparisonResult.schema2_errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {!comparisonResult.are_identical && comparisonResult.differences && (
                <div className="differences-section">
                  <h4>Differences Found:</h4>
                  <pre className="differences-display">
                    {JSON.stringify(comparisonResult.differences, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {activeTab === 'compare-files' && (
        <div className="content-section">
          <div className="card">
            <h2>Compare YAML Files</h2>
            <p className="description">Upload two YAML files to compare their contents</p>
          
          <div className="file-comparison">
            <div className="file-upload-comparison">
              <label htmlFor="schema-files">Select Two YAML Files to Compare</label>
              <input 
                type="file" 
                id="schema-files"
                accept=".yaml,.yml" 
                multiple
                onChange={handleSchemaFileComparison}
                disabled={isLoading}
              />
              <p className="note">Hold Ctrl/Cmd and click to select exactly 2 files</p>
            </div>

            {comparisonResult && (
              <div className="comparison-result">
                <h3>File Comparison Result</h3>
                <div className={`result-summary ${comparisonResult.are_identical ? 'identical' : 'different'}`}>
                  <div className="result-header">
                    <span className="schema-names">
                      {comparisonResult.schema1_name} vs {comparisonResult.schema2_name}
                    </span>
                    <span className={`result-badge ${comparisonResult.are_identical ? 'identical' : 'different'}`}>
                      {comparisonResult.are_identical ? '✓ Identical' : '⚠ Different'}
                    </span>
                  </div>
                </div>

                <div className="validation-status">
                  <div className={`schema-status ${comparisonResult.schema1_valid ? 'valid' : 'invalid'}`}>
                    <strong>{comparisonResult.schema1_name}:</strong> 
                    {comparisonResult.schema1_valid ? ' Valid YAML' : ' Invalid YAML'}
                    {comparisonResult.schema1_errors && (
                      <ul className="error-list">
                        {comparisonResult.schema1_errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={`schema-status ${comparisonResult.schema2_valid ? 'valid' : 'invalid'}`}>
                    <strong>{comparisonResult.schema2_name}:</strong> 
                    {comparisonResult.schema2_valid ? ' Valid YAML' : ' Invalid YAML'}
                    {comparisonResult.schema2_errors && (
                      <ul className="error-list">
                        {comparisonResult.schema2_errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {!comparisonResult.are_identical && comparisonResult.differences && (
                  <div className="differences-section">
                    <h4>Differences Found:</h4>
                    <pre className="differences-display">
                      {JSON.stringify(comparisonResult.differences, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}

export default App;