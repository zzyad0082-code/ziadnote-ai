"use client";

import Link from "next/link";
import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// ✅ Worker في المتصفح فقط
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";
}

export default function ExamPage() {
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [examFiles, setExamFiles] = useState<File[]>([]);
  const [sourceFileNames, setSourceFileNames] = useState<string[]>([]);
  const [examFileNames, setExamFileNames] = useState<string[]>([]);
  const [examAnswers, setExamAnswers] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 منع السيرفر نهائيًا
  async function extractPDFText(file: File) {
    if (typeof window === "undefined") return "";

    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const strings = content.items.map((item: any) =>
          "str" in item ? item.str : ""
        );

        text += strings.join(" ");
      }

      return text;
    } catch (error) {
      console.log("PDF Error:", error);
      return "";
    }
  }

  async function extractFileText(file: File) {
    if (file.type === "application/pdf") {
      return await extractPDFText(file);
    }

    return await file.text();
  }

  function handleSourceFiles(files: File[]) {
    setSourceFiles(files);
    setSourceFileNames(files.map((file) => file.name));
  }

  function handleExamFiles(files: File[]) {
    setExamFiles(files);
    setExamFileNames(files.map((file) => file.name));
  }

  async function solveExam() {
    if (sourceFiles.length === 0 || examFiles.length === 0) {
      alert("Upload files first");
      return;
    }

    setLoading(true);

    let sourceText = "";
    let examText = "";

    for (const file of sourceFiles) {
      sourceText += "\n\n" + await extractFileText(file);
    }

    for (const file of examFiles) {
      examText += "\n\n" + await extractFileText(file);
    }

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sourceText,
          examText,
        }),
      });

      const data = await response.json();
      setExamAnswers(data.result || "No result");
    } catch (error) {
      console.log(error);
      setExamAnswers("Error solving exam");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-16">
          <h1 className="text-4xl font-bold">Exam Solver</h1>

          <Link
            href="/"
            className="bg-blue-600 px-6 py-3 rounded-2xl"
          >
            Study Page
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">

          {/* LEFT SIDE */}
          <div className="space-y-8">

            {/* SOURCE FILES */}
            <div className="bg-zinc-900 rounded-3xl p-6">
              <h2 className="text-2xl font-bold mb-6">
                Source Files
              </h2>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleSourceFiles(Array.from(e.dataTransfer.files));
                }}
                className="border-2 border-dashed border-zinc-600 rounded-3xl p-10 text-center mb-6 hover:border-blue-500 transition"
              >
                <p className="text-gray-300 mb-4">
                  Drag & Drop Source Files
                </p>

                <label className="bg-blue-600 px-6 py-3 rounded-2xl cursor-pointer inline-block">
                  Choose Files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      handleSourceFiles(Array.from(e.target.files || []))
                    }
                  />
                </label>
              </div>

              {sourceFileNames.map((name, i) => (
                <p key={i}>{name}</p>
              ))}
            </div>

            {/* EXAM FILES */}
            <div className="bg-zinc-900 rounded-3xl p-6">
              <h2 className="text-2xl font-bold mb-6">
                Exam Files
              </h2>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleExamFiles(Array.from(e.dataTransfer.files));
                }}
                className="border-2 border-dashed border-zinc-600 rounded-3xl p-10 text-center mb-6 hover:border-red-500 transition"
              >
                <p className="text-gray-300 mb-4">
                  Drag & Drop Exam Files
                </p>

                <label className="bg-red-600 px-6 py-3 rounded-2xl cursor-pointer inline-block">
                  Choose Files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      handleExamFiles(Array.from(e.target.files || []))
                    }
                  />
                </label>
              </div>

              {examFileNames.map((name, i) => (
                <p key={i}>{name}</p>
              ))}
            </div>

            <button
              onClick={solveExam}
              className="bg-yellow-500 text-black px-6 py-3 rounded-2xl font-bold"
            >
              Solve Exam
            </button>

          </div>

          {/* RIGHT SIDE */}
          <div className="bg-zinc-900 rounded-3xl p-6">
            <h2 className="text-3xl font-bold mb-6">
              Exam Answers
            </h2>

            <div className="bg-black rounded-2xl p-5 min-h-[700px] overflow-auto">
              {loading ? (
                <p>Solving...</p>
              ) : (
                <p className="whitespace-pre-wrap">
                  {examAnswers}
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
