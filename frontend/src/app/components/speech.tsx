"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useTextureStore from './texture'


const LOADING_MESSAGES = [
    "Tracing all the rays...",
    "Working hard on the raymarching...",
    "Showing your world some love...",
    "Sculpting fractals and shapes...",
    "Infusing magic into the pixels...",
];

interface DictaphoneProps {
    generateShader: (prompt: string) => void;
    modifyShader: (prompt: string) => void;
    resetShader: () => void;
    shaderLoading: boolean;
}

const Dictaphone = ({
    generateShader,
    modifyShader,
    resetShader,
    shaderLoading,
}: DictaphoneProps) => {
    const [textPrompt, setTextPrompt] = useState("");

    const [hasMounted, setHasMounted] = useState(false);

    // For rotating loading messages
    const [messageIndex, setMessageIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const setTexture = useTextureStore((state) => state.setTexture);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          const file = e.target.files[0];
          const fileReader = new FileReader();
          fileReader.onloadend = () => {
            setTexture(fileReader.result as string);
          }
          fileReader.readAsDataURL(file);
        }
    };

    const handleTextPrompt = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const prompt = textPrompt.trim();
        if (!prompt || shaderLoading) return;

        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt === "reset") {
            resetShader();
        } else if (lowerPrompt.startsWith("modify ")) {
            modifyShader(prompt.slice("modify ".length).trim());
        } else {
            generateShader(prompt);
        }
        setTextPrompt("");
    };

    /**
     * Show rotating LOADING_MESSAGES every 2s if shaderLoading = true.
     * Clear when done.
     */
    useEffect(() => {
        if (shaderLoading) {
            setMessageIndex(0);
            intervalRef.current = setInterval(() => {
                setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 2000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            toast.success("VisuWorld loaded successfully!");
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [shaderLoading]);

    if (!hasMounted) return null;

    // If loading, show the spinner + rotating text
    const showLoading = shaderLoading;

    return (
        <div className="relative w-full h-full p-4 flex flex-col justify-start gap-4 text-white rounded-xl">
            <div className="space-y-2">
                <h1 className="text-xl font-extrabold tracking-tight">
                    Welcome to <span className="text-blue-400">VisuWorld</span>
                </h1>
                <p className="text-sm leading-relaxed text-slate-300">
                    Speak visually engaging virtual landscapes into existence.
                    VisuWorld is powered by{" "}
                    <span className="text-blue-400 font-bold">
                        Google Gemini
                    </span>{" "}
                    and customizable{" "}
                    <span className="text-blue-400 font-bold">GLSL</span>{" "}
                    programming paradigms. Peer into the other side of the
                    screen, and let your words shape the world.
                </p>
            </div>

            <div>
                <label htmlFor="file-upload" className="cursor-pointer border-2 border-gray-300 text-sm rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition duration-300 text-black">
                    Upload Texture
                </label>
                <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileChange}
                />
            </div>

            {/* Bottom overlay: transcript or spinner */}
            <div className="absolute top-[480px] sm:top-auto sm:bottom-4 left-4 right-4">
                {showLoading ? (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <h2 className="text-lg font-semibold text-slate-200 animate-pulse">
                            {LOADING_MESSAGES[messageIndex]}
                        </h2>
                        <div
                            role="progressbar"
                            aria-label="Generating shader"
                            aria-busy="true"
                            className="h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-700"
                        >
                            <div className="h-full w-2/5 rounded-full bg-blue-400 animate-[pulse_1.2s_ease-in-out_infinite]" />
                        </div>
                        <p className="text-xs text-slate-400">
                            Generating your shader. This will finish when the API responds.
                        </p>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleTextPrompt} className="mb-2 flex gap-2">
                            <input
                                value={textPrompt}
                                onChange={(e) => setTextPrompt(e.target.value)}
                                placeholder="Type a shader prompt..."
                                aria-label="Shader text prompt"
                                className="min-w-0 flex-1 rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!textPrompt.trim()}
                                className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Create
                            </button>
                        </form>
                        <div className="bg-slate-700/80 border border-slate-500 shadow rounded-lg px-4 py-2 text-sm text-slate-100 transition-all duration-300 ease-in-out">
                            Ready for a text prompt.
                        </div>
                        <div className="text-[0.75rem] text-slate-400 mt-2 -mb-2">
                            Type a prompt to create a VisuWorld. Use "modify" to
                            adjust it or "reset" to clear it.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dictaphone;
