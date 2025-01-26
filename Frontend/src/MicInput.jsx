// MicInput.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import { Mic } from 'lucide-react';

const MicInput = ({ onTranscription, isDisabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await axios.post("/api/speech-to-text", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          onTranscription(response.data.transcription);
        } catch (error) {
          console.error("Error transcribing audio:", error);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={handleMicClick}
      disabled={isDisabled}
      className={`p-2 rounded-lg transition-colors ${
        isRecording ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"
      } hover:bg-red-700 disabled:bg-gray-400`}
    >
      <Mic size={20} />
    </button>
  );
};

export default MicInput;
