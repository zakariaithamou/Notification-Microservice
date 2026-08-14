"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, FileText, Rocket } from "lucide-react";

// Interface based on your Mongoose Schema
interface ITemplate {
  _id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  templateType: "single" | "diffusion";
}

interface IFiliere {
  name: string;
  code: string;
}

interface IDepartment {
  _id: string;
  name: string;
  programType: "prepa_ingenieur" | "licence_master";
  filieres: {
    licence: IFiliere[];
    master: IFiliere[];
    ingenieur: IFiliere[];
  };
}

export default function SendNotificationPage() {
  const router = useRouter();

  // Mode and Filter States
  const [mode, setMode] = useState<"single" | "diffusion" | "">("");
  const [cycle, setCycle] = useState<
    "" | "preparatoire" | "ingenieur" | "licence" | "master"
  >("");
  const [annee, setAnnee] = useState<number | "">("");
  const [filiere, setFiliere] = useState<string>("");

  // Form State
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [recipients, setRecipients] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [recipientCount, setRecipientCount] = useState<number>(1);
  const [singleRecipients, setSingleRecipients] = useState<
    { email: string; variables: Record<string, string> }[]
  >([{ email: "", variables: {} }]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Filter templates based on the chosen mode
  const filteredTemplates = templates.filter((t) => t.templateType === mode);

  // Department state for dynamic filters
  const [department, setDepartment] = useState<IDepartment | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch BOTH department info and templates using cookies!
        const [deptRes, templatesRes] = await Promise.all([
          fetch("/api/departments/me"),
          fetch("/api/templates"),
        ]);

        if (deptRes.status === 401 || templatesRes.status === 401) {
          router.push("/");
          return;
        }

        // 1. Process Department Info
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (deptData.success && deptData.data) {
            const dept = deptData.data;
            setDepartment(dept);

            // Set intelligent defaults
            if (dept.programType === "prepa_ingenieur") {
              setCycle("preparatoire");
            } else if (
              dept.programType === "licence_master" ||
              dept.programType === "licence-master"
            ) {
              setCycle("licence");
            }
            setAnnee(1);
          }
        }

        // 2. Process Templates
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Extract variables like {{userName}} from the selected template
  const getRequiredVariables = () => {
    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template) return [];

    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    const combinedText = (template.subject || "") + " " + template.body;

    while ((match = regex.exec(combinedText)) !== null) {
      matches.push(match[1].trim());
    }

    let uniqueVars = Array.from(new Set(matches));

    // If in diffusion mode, hide variables the database will auto-fill
    if (mode === "diffusion") {
      const dbVariables = ["firstName", "lastName", "email", "phone"];
      uniqueVars = uniqueVars.filter((v) => !dbVariables.includes(v));
    }

    return uniqueVars;
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  // --- HANDLERS FOR SINGLE MODE ---
  const handleRecipientCountChange = (count: number) => {
    const newCount = Math.max(1, count);
    setRecipientCount(newCount);

    setSingleRecipients((prev) => {
      const newData = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          newData.push({ email: "", variables: {} });
        }
      } else {
        newData.length = newCount;
      }
      return newData;
    });
  };

  const handleSingleEmailChange = (index: number, email: string) => {
    setSingleRecipients((prev) => {
      const newData = [...prev];
      newData[index].email = email;
      return newData;
    });
  };

  const handleSingleVariableChange = (
    index: number,
    key: string,
    value: string,
  ) => {
    setSingleRecipients((prev) => {
      const newData = [...prev];
      newData[index].variables = { ...newData[index].variables, [key]: value };
      return newData;
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage({ text: "", type: "" });

    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template) {
      setSending(false);
      return;
    }

    // We will collect all requests in this array to send them all at the exact same time
    const requestPromises: Promise<Response>[] = [];

    // --- SINGLE MODE ---
    if (mode === "single") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // 1. Validate all emails first
      for (let i = 0; i < singleRecipients.length; i++) {
        if (!emailRegex.test(singleRecipients[i].email.trim())) {
          setMessage({
            text: `Invalid email format at Recipient #${i + 1}`,
            type: "error",
          });
          setSending(false);
          return;
        }
      }

      // 2. Build a unique payload for EACH recipient box
      singleRecipients.forEach((rec) => {
        let finalSubject = template.subject || "";
        let finalBody = template.body;

        // Apply this specific recipient's variables
        Object.entries(rec.variables).forEach(([key, val]) => {
          const replaceRegex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          finalSubject = finalSubject.replace(replaceRegex, val);
          finalBody = finalBody.replace(replaceRegex, val);
        });

        const payload = {
          templateId: template._id,
          channel: template.channel,
          recipients: [{ address: rec.email.trim() }],
          variables: rec.variables,
          renderedSubject: finalSubject,
          renderedBody: finalBody,
        };

        // Queue the request
        requestPromises.push(
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        );
      });

      // --- DIFFUSION MODE  ---
    } else if (mode === "diffusion") {
      try {
        const studentRes = await fetch("/api/students/filter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycle, annee, filiere }),
        });

        if (studentRes.status === 401) {
          router.push("/");
          return;
        }

        const studentData = await studentRes.json();
        if (
          !studentRes.ok ||
          !studentData.data ||
          studentData.data.length === 0
        ) {
          setMessage({
            text: "No students found matching these filters.",
            type: "error",
          });
          setSending(false);
          return;
        }

        const validRecipientArray = studentData.data.map(
          (student: { email: string }) => ({ address: student.email }),
        );

        let finalSubject = template.subject || "";
        let finalBody = template.body;

        Object.entries(variables).forEach(([key, val]) => {
          const replaceRegex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          finalSubject = finalSubject.replace(replaceRegex, val);
          finalBody = finalBody.replace(replaceRegex, val);
        });

        const payload = {
          templateId: template._id,
          channel: template.channel,
          recipients: validRecipientArray,
          variables: variables,
          renderedSubject: finalSubject,
          renderedBody: finalBody,
        };

        requestPromises.push(
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        );
      } catch (error) {
        console.error(error);
        setMessage({
          text: "Failed to fetch students from database.",
          type: "error",
        });
        setSending(false);
        return;
      }
    }

    // --- EXECUTE ALL REQUESTS ---
    try {
      // Fire all notification requests concurrently
      const responses = await Promise.all(requestPromises);

      // Check if the cookie expired
      if (responses.some((res) => res.status === 401)) {
        router.push("/");
        return;
      }

      // Check if any request failed
      const failedRequest = responses.find((res) => !res.ok);
      if (failedRequest) {
        const data = await failedRequest.json();
        throw new Error(
          data.error || "One or more notifications failed to queue.",
        );
      }

      setMessage({
        text: `Success! ${responses.length} Notification(s) safely queued for delivery.`,
        type: "success",
      });

      // Reset Forms
      setRecipientCount(1);
      setSingleRecipients([{ email: "", variables: {} }]);
      setVariables({});
      setSelectedTemplateId("");

      if (mode === "diffusion") {
        setCycle("");
        setAnnee("");
        setFiliere("");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred.", type: "error" });
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>

        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  const requiredVars = getRequiredVariables();

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Rocket className="w-5 h-5" /> Sending Notifications
      </h1>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-md border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. MODE SELECTION */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notification Mode *
          </label>
          <select
            required
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "single" | "diffusion");
              setSelectedTemplateId(""); // Reset template when mode changes
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              -- Select Mode --
            </option>
            <option value="single">Single </option>
            <option value="diffusion">Diffusion </option>
          </select>
        </div>

        {/* 2. TEMPLATE SELECTION (Only shows if mode is selected) */}
        {mode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Template *
            </label>
            <select
              required
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                setVariables({});
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                -- Choose a template --
              </option>
              {filteredTemplates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.channel})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3. VARIABLES INPUT */}
        {/* 3. DIFFUSION VARIABLES (Global for the Cohort) */}
        {mode === "diffusion" && requiredVars.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              Required Variables (Global for Cohort)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredVars.map((v) => (
                <div key={v}>
                  <label className="block text-xs font-medium text-blue-900 mb-1">
                    {v}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Enter value for ${v}`}
                    value={variables[v] || ""}
                    onChange={(e) => handleVariableChange(v, e.target.value)}
                    className="w-full rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DYNAMIC SECTION: SINGLE vs DIFFUSION RECIPIENTS */}
        {/* 4. DYNAMIC SECTION: SINGLE vs DIFFUSION RECIPIENTS */}

        {/* --- NEW SINGLE MODE UI --- */}
        {mode === "single" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Recipients *
              </label>
              <input
                type="number"
                min="1"
                required
                value={recipientCount}
                onChange={(e) =>
                  handleRecipientCountChange(Number(e.target.value))
                }
                className="w-32 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {singleRecipients.map((recipient, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm space-y-4"
                >
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2">
                    Recipient {index + 1}
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@email.com"
                      value={recipient.email}
                      onChange={(e) =>
                        handleSingleEmailChange(index, e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {requiredVars.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-blue-800">
                        Variables
                      </p>
                      {requiredVars.map((v) => (
                        <div key={v}>
                          <label className="block text-xs text-gray-600 mb-1">
                            {v}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={`Value for ${v}`}
                            value={recipient.variables[v] || ""}
                            onChange={(e) =>
                              handleSingleVariableChange(
                                index,
                                v,
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "diffusion" && (
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Targeting Filters {department ? `(${department.name})` : ""}
            </h3>

            {/* Cycle / Program Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cycle / Program *
              </label>
              <select
                required
                value={cycle}
                onChange={(e) => {
                  const selectedCycle = e.target.value as
                    "preparatoire" | "ingenieur" | "licence" | "master";
                  setCycle(selectedCycle);
                  // Auto-set default year range rules
                  setAnnee(selectedCycle === "master" ? 4 : 1);
                  setFiliere("");
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              >
                {!department || department.programType === "prepa_ingenieur" ? (
                  <>
                    <option value="preparatoire">Cycle Préparatoire</option>
                    <option value="ingenieur">Cycle Ingénieur</option>
                  </>
                ) : (
                  <>
                    <option value="licence">Licence</option>
                    <option value="master">Master</option>
                  </>
                )}
              </select>
            </div>

            {/* Cascading Année (1-3 for Licence/Prepa/Ingenieur, 4-5 for Master) */}
            {cycle && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Année *
                </label>
                <select
                  required
                  value={annee}
                  onChange={(e) => setAnnee(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                >
                  {cycle === "master" ? (
                    <>
                      <option value={4}>4ème Année (M1)</option>
                      <option value={5}>5ème Année (M2)</option>
                    </>
                  ) : (
                    <>
                      <option value={1}>1ère Année</option>
                      <option value={2}>2ème Année</option>
                      <option value={3}>3ème Année</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Dynamic Filière Selection pulled directly from Database structures */}
            {cycle && cycle !== "preparatoire" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Filière *
                </label>
                <select
                  required
                  value={filiere}
                  onChange={(e) => setFiliere(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                >
                  <option value="" disabled>
                    -- Select Filière --
                  </option>
                  {department?.filieres[
                    cycle as keyof typeof department.filieres
                  ]?.map((fil: IFiliere) => (
                    <option key={fil.code} value={fil.code}>
                      {fil.name} ({fil.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={sending || !selectedTemplateId}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Processing Payload..." : "Transmit to Microservice"}
          </button>
        </div>
      </form>
    </div>
  );
}
