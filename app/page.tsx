"use client";

import Link from "next/link";
import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

import "pdfjs-dist/build/pdf.worker.min.mjs";

export default function Home() {

  const [sourceFiles, setSourceFiles] = useState<File[]>([]);

  const [sourceFileNames, setSourceFileNames] = useState<string[]>([]);

  const [summary, setSummary] = useState("");

  const [quiz, setQuiz] = useState("");

  const [loading, setLoading] = useState(false);

  async function extractPDFText(file: File) {

    try {

      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
      });

      const pdf = await loadingTask.promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {

        const page = await pdf.getPage(i);

        const content = await page.getTextContent();

        const strings = content.items.map(
          (item: any) => ("str" in item ? item.str : "")
        );

        text += strings.join(" ");
      }

      return text;

    } catch (error) {

      console.log(error);

      return "";

    }
  }

  async function extractFileText(file: File) {

    if (file.type === "application/pdf") {

      return await extractPDFText(file);

    }

    return await file.text();
  }

  function handleFiles(files: File[]) {

    setSourceFiles(files);

    setSourceFileNames(
      files.map((file) => file.name)
    );
  }

  async function generateStudyContent() {

    try {

      if (sourceFiles.length === 0) {

        alert("Upload source files first");

        return;
      }

      setLoading(true);

      let sourceText = "";

      for (const file of sourceFiles) {

        const text =
          await extractFileText(file);

        sourceText += "\n\n" + text;
      }

      const response = await fetch("/api/summary", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          text: sourceText,
        }),

      });

      const data = await response.json();

      const result = data.result || "";

      const summaryPart =
        result.split("# Quiz Questions")[0];

      const quizPart =
        result.split("# Quiz Questions")[1];

      setSummary(summaryPart);

      setQuiz(quizPart);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }
  }

  return (

    <div className="min-h-screen bg-black text-white p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-16">

          <h1 className="text-4xl font-bold">
            ZiadNote AI
          </h1>

          <Link
            href="/exam"
            className="bg-yellow-500 text-black px-6 py-3 rounded-2xl font-semibold"
          >
            Exam Solver
          </Link>

        </div>

        <section className="grid lg:grid-cols-2 gap-10">

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">

            <h2 className="text-3xl font-bold mb-6">
              Study Assistant
            </h2>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {

                e.preventDefault();

                const droppedFiles = Array.from(
                  e.dataTransfer.files
                );

                handleFiles(droppedFiles);
              }}
              className="border-2 border-dashed border-zinc-600 rounded-3xl p-10 text-center mb-6 hover:border-blue-500 transition"
            >

              <p className="text-gray-300 mb-4">
                Drag & Drop Files Here
              </p>

              <label className="bg-blue-600 px-6 py-3 rounded-2xl cursor-pointer inline-block">

                Choose Files

                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => {

                    const files = Array.from(
                      e.target.files || []
                    );

                    handleFiles(files);
                  }}
                />

              </label>

            </div>

            <div className="space-y-2 mb-6">

              {sourceFileNames.map((name, index) => (

                <p key={index}>
                  {name}
                </p>

              ))}

            </div>

            <button
              onClick={generateStudyContent}
              className="bg-green-600 px-6 py-3 rounded-2xl"
            >
              Generate Study Content
            </button>

          </div>

          <div className="space-y-6">

            <div className="bg-zinc-900 rounded-3xl p-6">

              <h3 className="text-3xl font-bold mb-6">
                Summary
              </h3>

              <div className="bg-black rounded-2xl p-5 min-h-[250px] overflow-auto">

                {loading ? (

                  <p>Generating...</p>

                ) : (

                  <p className="whitespace-pre-wrap">
                    {summary}
                  </p>

                )}

              </div>

            </div>

            <div className="bg-zinc-900 rounded-3xl p-6">

              <h3 className="text-3xl font-bold mb-6">
                Quiz Questions
              </h3>

              <div className="bg-black rounded-2xl p-5 min-h-[400px] overflow-auto">

                <p className="whitespace-pre-wrap">
                  {quiz}
                </p>

              </div>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
  }
