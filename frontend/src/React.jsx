import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup"; // By integrating Yup with Formik, your forms can automatically check user inputs against the given schemas
//#endregion

// Schema for Add & Update (mirrors your Python schema constraints)
const configSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  age: Yup.number().min(0, "Age must be at least 0").required("Age is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  is_active: Yup.boolean(),
  hobbies: Yup.string(), // Comma-separated list; can split on server side
  street: Yup.string(),
  city: Yup.string(),
  zip_code: Yup.string(),
});

// Schema for operations that only need an ID
const idSchema = Yup.object().shape({
  id: Yup.number().required("ID is required"),
});

function App() {
  return (
    <div style={{ padding: "1rem" }}>
      <h1>FastAPI Endpoints UI with Formik</h1>

      {/*** 1. Validate YAML (Manual File Upload) ***/}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Validate YAML</h2>
        <Formik
          initialValues={{}}
          onSubmit={async (_, { setStatus }) => {
            // This example does not use Formik for file input.
            setStatus({ error: "Use the file upload below." });
          }}
        >
          {({ status }) => (
            <Form>
              <p>
                For YAML validation, please use the manual file input below:
              </p>
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    const res = await fetch("/validate", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (error) {
                    alert("Error: " + error.toString());
                  }
                }}
              />
              {status && status.error && (
                <div style={{ color: "red" }}>{status.error}</div>
              )}
            </Form>
          )}
        </Formik>
      </section>

      {/*** 2. Add Config ***/}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Add Config</h2>
        <Formik
          initialValues={{
            name: "",
            age: "",
            email: "",
            is_active: false,
            hobbies: "",
            street: "",
            city: "",
            zip_code: "",
          }}
          validationSchema={configSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              // Use URLSearchParams to create query string
              const queryParams = new URLSearchParams(values).toString();
              const response = await fetch(`/configs/?${queryParams}`, {
                method: "POST",
              });
              const data = await response.json();
              setStatus(data);
            } catch (error) {
              setStatus({ error: error.toString() });
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, status }) => (
            <Form>
              {["name", "age", "email", "hobbies", "street", "city", "zip_code"].map((field) => (
                <div key={field}>
                  <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
                  <Field id={field} name={field} type={field === "age" ? "number" : "text"} />
                  <ErrorMessage name={field} component="div" style={{ color: "red" }} />
                </div>
              ))}
              <div>
                <label>
                  <Field name="is_active" type="checkbox" />
                  Is Active
                </label>
              </div>
              <button type="submit" disabled={isSubmitting} style={{ marginTop: "8px" }}>
                Add Config
              </button>
              {status && (
                <div style={{ marginTop: "1rem" }}>
                  <pre>{JSON.stringify(status, null, 2)}</pre>
                </div>
              )}
            </Form>
          )}
        </Formik>
      </section>

      {/*** 3. Get Config ***/}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Get Config</h2>
        <Formik
          initialValues={{ id: "" }}
          validationSchema={idSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              const response = await fetch(`/configs/${values.id}`);
              const data = await response.json();
              setStatus(data);
            } catch (error) {
              setStatus({ error: error.toString() });
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, status }) => (
            <Form>
              <div>
                <label htmlFor="id">Config ID:</label>
                <Field id="id" name="id" type="number" />
                <ErrorMessage name="id" component="div" style={{ color: "red" }} />
              </div>
              <button type="submit" disabled={isSubmitting} style={{ marginTop: "8px" }}>
                Get Config
              </button>
              {status && (
                <div style={{ marginTop: "1rem" }}>
                  <pre>{JSON.stringify(status, null, 2)}</pre>
                </div>
              )}
            </Form>
          )}
        </Formik>
      </section>

      {/*** 4. Update Config ***/}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Update Config</h2>
        <Formik
          initialValues={{
            id: "",
            name: "",
            age: "",
            email: "",
            is_active: false,
            hobbies: "",
            street: "",
            city: "",
            zip_code: "",
          }}
          validationSchema={configSchema.concat(idSchema)}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              const { id, ...rest } = values;
              const queryParams = new URLSearchParams(rest).toString();
              const response = await fetch(`/configs/${id}?${queryParams}`, {
                method: "PUT",
              });
              const data = await response.json();
              setStatus(data);
            } catch (error) {
              setStatus({ error: error.toString() });
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, status }) => (
            <Form>
              <div>
                <label htmlFor="id">Config ID:</label>
                <Field id="id" name="id" type="number" />
                <ErrorMessage name="id" component="div" style={{ color: "red" }} />
              </div>
              {["name", "age", "email", "hobbies", "street", "city", "zip_code"].map((field) => (
                <div key={field}>
                  <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
                  <Field id={field} name={field} type={field === "age" ? "number" : "text"} />
                  <ErrorMessage name={field} component="div" style={{ color: "red" }} />
                </div>
              ))}
              <div>
                <label>
                  <Field name="is_active" type="checkbox" />
                  Is Active
                </label>
              </div>
              <button type="submit" disabled={isSubmitting} style={{ marginTop: "8px" }}>
                Update Config
              </button>
              {status && (
                <div style={{ marginTop: "1rem" }}>
                  <pre>{JSON.stringify(status, null, 2)}</pre>
                </div>
              )}
            </Form>
          )}
        </Formik>
      </section>

      {/*** 5. Delete Config ***/}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Delete Config</h2>
        <Formik
          initialValues={{ id: "" }}
          validationSchema={idSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              const response = await fetch(`/configs/${values.id}`, {
                method: "DELETE",
              });
              const data = await response.json();
              setStatus(data);
            } catch (error) {
              setStatus({ error: error.toString() });
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, status }) => (
            <Form>
              <div>
                <label htmlFor="id">Config ID:</label>
                <Field id="id" name="id" type="number" />
                <ErrorMessage name="id" component="div" style={{ color: "red" }} />
              </div>
              <button type="submit" disabled={isSubmitting} style={{ marginTop: "8px" }}>
                Delete Config
              </button>
              {status && (
                <div style={{ marginTop: "1rem" }}>
                  <pre>{JSON.stringify(status, null, 2)}</pre>
                </div>
              )}
            </Form>
          )}
        </Formik>
      </section>
    </div>
  );
}

export default App;
