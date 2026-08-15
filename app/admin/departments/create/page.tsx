"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAutoClearError } from "@/app/hooks/useAutoClearError";

type ProgramType = "licence_master" | "prepa_ingenieur" | "";
type Filiere = { name: string; code: string };

export default function CreateDepartmentPage() {
  const router = useRouter();

  // Form State - Basic Info
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [allowedChannels, setAllowedChannels] = useState<string[]>(["email"]);

  // Form State - Programme Structure
  const [programType, setProgramType] = useState<ProgramType>("");
  const [filieres, setFilieres] = useState<{
    licence: Filiere[];
    master: Filiere[];
    ingenieur: Filiere[];
  }>({
    licence: [],
    master: [],
    ingenieur: [],
  });

  // Temporary state for the input fields when typing a new filière
  const [filiereInputs, setFiliereInputs] = useState({
    licence: { name: "", code: "" },
    master: { name: "", code: "" },
    ingenieur: { name: "", code: "" },
  });

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const { error, setError } = useAutoClearError();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  // Generated API key
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Toggle a channel in the selection list
  const handleCheckboxChange = (channel: string) => {
    setAllowedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  // Helper to add a filiere to the correct array
  const handleAddFiliere = (cycle: "licence" | "master" | "ingenieur") => {
    const { name, code } = filiereInputs[cycle];
    if (!name.trim() || !code.trim()) return;

    setFilieres((prev) => ({
      ...prev,
      [cycle]: [
        ...prev[cycle],
        { name: name.trim(), code: code.trim().toUpperCase() },
      ],
    }));

    // Clear the input for that specific cycle
    setFiliereInputs((prev) => ({
      ...prev,
      [cycle]: { name: "", code: "" },
    }));
  };

  //  Helper to remove a filiere
  const handleRemoveFiliere = (
    cycle: "licence" | "master" | "ingenieur",
    index: number,
  ) => {
    setFilieres((prev) => ({
      ...prev,
      [cycle]: prev[cycle].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (allowedChannels.length === 0) {
      setError(
        "You must select at least one allowed channel for this department.",
      );
      setIsLoading(false);
      return;
    }

    if (!programType) {
      setError("Please select a Programme Structure.");
      setIsLoading(false);
      return;
    }

    try {
      const adminToken = localStorage.getItem("admin_token");

      const res = await fetch("/api/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": adminToken || "",
        },
        // Added programType and filieres to the payload
        body: JSON.stringify({
          name,
          contactEmail,
          allowedChannels,
          programType,
          filieres,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message || json.error || "Failed to create department",
        );
      }

      // Store the generated key
      setGeneratedKey(json.data.apiKey);
      setGeneratedPassword(json.data.temporaryPassword);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // PHASE 2: The Success Screen
  // PHASE 2: The Success Screen
  if (generatedKey) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Department Created Successfully!
          </h2>
          <p className="text-gray-700 mb-6">
            Please copy these credentials and send them to the department head.{" "}
            <strong className="text-red-600">
              You will not be able to see these again.
            </strong>
          </p>

          <div className="text-left bg-white p-6 rounded-md border border-green-300 mb-6 space-y-6">
            {/* Human Login Credentials */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Dashboard Login Password
              </h3>
              <p className="text-xs text-red-600 mb-2 font-medium">
                ⚠️ Expires in 24 hours. The department must log in before then.
              </p>
              <div className="bg-gray-100 text-black p-3 rounded text-lg font-mono break-all select-all border border-gray-200">
                {generatedPassword}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* System API Key */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                System API Key
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Used for backend server-to-server tracking.
              </p>
              <div className="bg-gray-200 text-gray-900 p-3 rounded text-lg font-mono break-all select-all">
                {generatedKey}
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("/admin/departments")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
          >
            I have copied both credentials
          </button>
        </div>
      </div>
    );
  }

  // Helper function to render the Filiere builder UI
  const renderFiliereBuilder = (
    cycle: "licence" | "master" | "ingenieur",
    title: string,
    duration: string,
  ) => (
    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
          {duration}
        </span>
      </div>

      {/* Input Row */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Filière Name (e.g., Génie Informatique)"
          className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          value={filiereInputs[cycle].name}
          onChange={(e) =>
            setFiliereInputs({
              ...filiereInputs,
              [cycle]: { ...filiereInputs[cycle], name: e.target.value },
            })
          }
        />
        <input
          type="text"
          placeholder="Code (e.g., GI)"
          className="w-24 border border-gray-300 rounded-md p-2 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-black"
          value={filiereInputs[cycle].code}
          onChange={(e) =>
            setFiliereInputs({
              ...filiereInputs,
              [cycle]: { ...filiereInputs[cycle], code: e.target.value },
            })
          }
        />
        <button
          type="button"
          onClick={() => handleAddFiliere(cycle)}
          className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"
        >
          Add
        </button>
      </div>

      {/* List of Added Filieres */}
      {filieres[cycle].length > 0 && (
        <ul className="space-y-2">
          {filieres[cycle].map((f, index) => (
            <li
              key={index}
              className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded-md text-sm"
            >
              <div>
                <span className="font-medium">{f.name}</span>
                <span className="ml-2 text-xs text-gray-500 font-mono bg-gray-100 px-1 rounded">
                  {f.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFiliere(cycle, index)}
                className="text-red-500 hover:text-red-700 font-bold px-2"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // PHASE 1: The Creation Form
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/departments"
          className="text-sm text-gray-500 hover:text-black"
        >
          &larr; Back to Departments
        </Link>
      </div>

      <h1 className="text-2xl text-center font-bold mb-6">
        Create New Department
      </h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
      >
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Department Name
          </label>
          <input
            type="text"
            required
            minLength={2}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g., École Polytechnique"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Contact Email
          </label>
          <input
            type="email"
            required
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="alerts@universiapolis.ma"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        {/* Allowed channels */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Allowed Channels
          </label>
          <div className="flex gap-4">
            {["email", "sms", "push", "whatsapp"].map((channel) => (
              <label
                key={channel}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={allowedChannels.includes(channel)}
                  onChange={() => handleCheckboxChange(channel)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="capitalize text-sm">{channel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Programme Structure Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <label className="block text-sm font-medium mb-4">
            Programme Structure & Filières
          </label>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="programType"
                value="licence_master"
                checked={programType === "licence_master"}
                onChange={(e) => setProgramType(e.target.value as ProgramType)}
                className="text-black focus:ring-black"
              />
              <span className="text-sm font-medium">Licence + Master</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="programType"
                value="prepa_ingenieur"
                checked={programType === "prepa_ingenieur"}
                onChange={(e) => setProgramType(e.target.value as ProgramType)}
                className="text-black focus:ring-black"
              />
              <span className="text-sm font-medium">
                Cycle Prépa + Cycle Ingénieur
              </span>
            </label>
          </div>

          {/* Dynamic Sections Based on Selection */}
          {programType === "licence_master" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {renderFiliereBuilder("licence", "Licence Filières", "3 Years")}
              {renderFiliereBuilder("master", "Master Filières", "2 Years")}
            </div>
          )}

          {programType === "prepa_ingenieur" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="mt-4 p-4 border border-blue-200 rounded-md bg-blue-50 text-blue-800 text-sm flex justify-between items-center">
                <span>
                  <strong>Cycle Préparatoire</strong> (Common Core - No specific
                  filières required)
                </span>
                <span className="text-xs bg-blue-200 px-2 py-1 rounded text-blue-900">
                  2 Years
                </span>
              </div>
              {renderFiliereBuilder(
                "ingenieur",
                "Cycle Ingénieur Filières",
                "3 Years",
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 mt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push("/admin/departments")}
            className="w-1/2 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-1/2 bg-black text-white py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium shadow-sm"
          >
            {isLoading ? "Creating..." : "Create Department"}
          </button>
        </div>
      </form>
    </div>
  );
}
