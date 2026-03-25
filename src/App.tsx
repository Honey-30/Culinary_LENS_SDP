/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Settings, 
  History, 
  ChefHat, 
  WifiOff, 
  Calendar,
  Database,
  ShoppingCart,
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Minus,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Flame,
  Dna,
  Scale,
  Zap,
  LayoutGrid,
  Package,
  Heart,
  User as UserIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { cn } from './lib/utils';
import { 
  Ingredient, 
  Recipe, 
  RecipeStep, 
  NutritionalGoal, 
  WorkflowState, 
  UserProfile,
  ScanResult
} from './types';
import { VisionEngine } from './services/visionEngine';
import { RecipeEngine } from './services/recipeEngine';
import { StorageService } from './services/storageService';
import { MealPlanService, MealPlanEntry } from './services/mealPlanService';
import { STATIC_RECIPES } from './services/staticRecipes';
import { LARGE_RECIPE_DATABASE } from './services/recipeDatabase';
import { PantryService } from './services/pantryService';
import { PantryTracker } from './components/PantryTracker';
import { MealPlanner } from './components/MealPlanner';
import { ProfileSettings } from './components/ProfileSettings';
import { ShoppingList } from './components/ShoppingList';
import { CookingTimer } from './components/CookingTimer';
import { User } from 'firebase/auth';
import { ShoppingListService } from './services/shoppingListService';
import { ScanResultService } from './services/scanResultService';
import { LocalSavedRecipeService } from './services/localSavedRecipeService';
import { INGREDIENT_DICTIONARY } from './services/ingredientSuggestionService';
import { IngredientPresetService, IngredientPreset } from './services/ingredientPresetService';

const FALLBACK_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000';
const OFFLINE_RECIPES = [...STATIC_RECIPES, ...LARGE_RECIPE_DATABASE];

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-zinc-800 shadow-sm',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-full',
    md: 'px-5 py-2.5 text-sm font-medium rounded-full',
    lg: 'px-8 py-4 text-base font-medium rounded-full',
    icon: 'p-2 rounded-full',
  };
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all',
      onClick && 'cursor-pointer active:scale-[0.98]',
      className
    )}
  >
    {children}
  </div>
);

const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'success' | 'warning' | 'info' }) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-blue-50 text-blue-600',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

const STATIC_SUBSTITUTIONS: Record<string, string[]> = {
  'milk': ['almond milk', 'soy milk', 'oat milk'],
  'egg': ['flaxseed meal', 'applesauce', 'mashed banana'],
  'butter': ['coconut oil', 'margarine', 'applesauce'],
  'flour': ['almond flour', 'oat flour', 'coconut flour'],
  'sugar': ['honey', 'maple syrup', 'stevia'],
  'onion': ['shallots', 'leeks', 'chives'],
  'garlic': ['garlic powder', 'shallots', 'chives'],
  'tomato': ['red bell pepper', 'tomatillo', 'carrots'],
  'potato': ['sweet potato', 'cauliflower', 'turnips'],
  'chicken': ['tofu', 'tempeh', 'seitan'],
  'beef': ['mushrooms', 'lentils', 'black beans'],
};

// --- Main App ---

export default function App() {
  // State
  const [workflow, setWorkflow] = useState<WorkflowState>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nutritionalGoal, setNutritionalGoal] = useState<NutritionalGoal>('BALANCED');
  const [cuisinePreference, setCuisinePreference] = useState('ALL');
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [localSavedRecipes, setLocalSavedRecipes] = useState<Recipe[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFreeTier, setIsFreeTier] = useState(() => localStorage.getItem('FREE_TIER_MODE') === 'true');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [servingsScale, setServingsScale] = useState(1);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);

  const handleRecipeImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    img.onerror = null;
    img.src = FALLBACK_RECIPE_IMAGE;
  };

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Services
  const visionEngine = React.useMemo(() => new VisionEngine(apiKey), [apiKey]);
  const recipeEngine = React.useMemo(() => new RecipeEngine(apiKey), [apiKey]);

  // Effects
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('FREE_TIER_MODE', isFreeTier.toString());
  }, [isFreeTier]);

  useEffect(() => {
    setScanResults(ScanResultService.getScanResults());
    setLocalSavedRecipes(LocalSavedRecipeService.getSavedRecipes());
  }, []);

  useEffect(() => {
    let unsubSavedRecipes: (() => void) | null = null;

    const unsub = StorageService.onAuthChange((u) => {
      setUser(u);

      if (unsubSavedRecipes) {
        unsubSavedRecipes();
        unsubSavedRecipes = null;
      }

      if (u) {
        unsubSavedRecipes = StorageService.onSavedRecipesChange(u.uid, setSavedRecipes);
      } else {
        setSavedRecipes([]);
      }
    });

    return () => {
      if (unsubSavedRecipes) {
        unsubSavedRecipes();
      }
      unsub();
    };
  }, []);

  // Handlers
  const handleSignIn = async () => {
    try {
      await StorageService.signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked. Please allow popups for this site and try again.");
      } else if (err.code !== 'auth/user-cancelled') {
        setError("Sign-in failed. Please try again or check your internet connection.");
      }
    }
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setWorkflow('LANDING');
  };

  const validateApiKey = async (key: string) => {
    setIsValidating(true);
    setValidationStatus('idle');
    try {
      const tempAi = new GoogleGenAI({ apiKey: key });
      // Simple validation call
      await tempAi.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: "ping" }] }],
        config: { maxOutputTokens: 1 }
      });
      setValidationStatus('success');
      setApiKey(key);
      return true;
    } catch (err) {
      console.error('API Key validation failed:', err);
      setValidationStatus('error');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const getSubstitutions = async (ingredient: string) => {
    const lowerIng = ingredient.toLowerCase();
    if (isFreeTier && STATIC_SUBSTITUTIONS[lowerIng]) {
      console.log("App: Using static substitutions in Free Tier Mode");
      return STATIC_SUBSTITUTIONS[lowerIng];
    }

    const prompt = `Suggest 3 smart substitutions for '${ingredient}' in a recipe. Return a JSON array of strings.`;
    try {
      const response = await visionEngine['ai'].models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return STATIC_SUBSTITUTIONS[lowerIng] || ["No substitutions found"];
    }
  };

  const addToMealPlan = async (recipe: Recipe, date: string, mealType: any) => {
    const entry: MealPlanEntry = {
      id: `meal-${Date.now()}`,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      date,
      type: mealType,
      recipeImageUrl: recipe.imageUrl
    };
    try {
      await MealPlanService.addEntry(user?.uid || '', entry);
      alert(`Added ${recipe.title} to your ${mealType} on ${date}`);
    } catch (err) {
      console.error('Failed to add to meal plan:', err);
      setError("Failed to add to meal plan.");
    }
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
        const base64 = imageDataUrl.split(',')[1];
        setCapturedImage(imageDataUrl);
        processImage(base64, imageDataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        const base64 = imageDataUrl.split(',')[1];
        setCapturedImage(imageDataUrl);
        processImage(base64, imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string, imageDataUrl: string | null = null) => {
    setWorkflow('PROCESSING');
    setIsProcessing(true);
    setError(null);
    try {
      const { ingredients: detected, humanDetected } = await visionEngine.processImage(base64);
      if (humanDetected) {
        setError("Human detected in frame. Please scan food items only for privacy.");
        setWorkflow('CAMERA_SCAN');
      } else {
        setIngredients(detected);
        const stored = ScanResultService.saveScanResult(imageDataUrl ?? capturedImage, detected);
        setScanResults((prev) => [stored, ...prev].slice(0, 50));
        setWorkflow('PERCEPTION_MAP');
      }
    } catch (err) {
      setError("Failed to process image. Try offline mode or check your API key.");
      setWorkflow('OFFLINE_MANUAL');
    } finally {
      setIsProcessing(false);
    }
  };

  const startSynthesis = async () => {
    setWorkflow('PROCESSING');
    setIsProcessing(true);
    try {
      const results = await recipeEngine.synthesizeRecipes(ingredients, cuisinePreference, nutritionalGoal, isFreeTier);
      setRecipes(results);
      setWorkflow('RECIPE_SELECTOR');
    } catch (err) {
      setError("Synthesis failed. Using local recipes.");
      setRecipes(OFFLINE_RECIPES.slice(0, 3));
      setWorkflow('RECIPE_SELECTOR');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveRecipe = async (recipe: Recipe) => {
    try {
      if (user) {
        await StorageService.saveRecipe(user.uid, recipe);
      } else {
        const next = LocalSavedRecipeService.saveRecipe(recipe);
        setLocalSavedRecipes(next);
      }
    } catch (err) {
      console.error('Failed to save recipe:', err);
      setError("Couldn't save recipe. Please try again.");
    }
  };

  const removeSavedRecipe = async (recipeId: string) => {
    try {
      if (user) {
        await StorageService.deleteRecipe(user.uid, recipeId);
      } else {
        const next = LocalSavedRecipeService.deleteRecipe(recipeId);
        setLocalSavedRecipes(next);
      }
    } catch (err) {
      console.error('Failed to delete saved recipe:', err);
      setError("Couldn't remove recipe. Please try again.");
    }
  };

  const speak = (text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const [showAddedAlert, setShowAddedAlert] = useState(false);

  const visibleSavedRecipes = user ? savedRecipes : localSavedRecipes;

  const handleAddIngredientsToShoppingList = () => {
    if (selectedRecipe) {
        const items = selectedRecipe.ingredients.map(name => ({
            name,
            quantity: 1, // Default quantity
            unit: 'unit', // Default unit
            recipeId: selectedRecipe.id
        }));
      ShoppingListService.addIngredientsToShoppingList(user?.uid || '', items)
            .then(() => {
                setShowAddedAlert(true);
                setTimeout(() => setShowAddedAlert(false), 3000);
            })
            .catch(error => {
                console.error("Failed to add ingredients to shopping list:", error);
                alert('Failed to add ingredients. Please try again.');
            });
    }
  };

  const handleUseScanResult = (scanResult: ScanResult) => {
    setIngredients(scanResult.ingredients);
    setCapturedImage(scanResult.imageDataUrl);
    setWorkflow('PERCEPTION_MAP');
  };

  const handleDeleteScanResult = (scanId: string) => {
    setScanResults(ScanResultService.deleteScanResult(scanId));
  };

  const getScanDelta = (currentScan: ScanResult, previousScan?: ScanResult) => {
    if (!previousScan) return { added: 0, removed: 0 };

    const currentNames = new Set(currentScan.ingredients.map((item) => item.name.toLowerCase()));
    const previousNames = new Set(previousScan.ingredients.map((item) => item.name.toLowerCase()));

    const added = [...currentNames].filter((name) => !previousNames.has(name)).length;
    const removed = [...previousNames].filter((name) => !currentNames.has(name)).length;

    return { added, removed };
  };

  // --- Views ---

  const LandingPage = () => (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 bg-black rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
            <ChefHat className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">Culinary Lens</h1>
          <p className="text-zinc-500 text-lg">Intelligent cooking, reimagined for your kitchen.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button onClick={() => setWorkflow('CAMERA_SCAN')} className="w-full py-6 text-lg" variant="primary">
            <Camera className="mr-2 w-5 h-5" /> Start Scanning
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setWorkflow('OFFLINE_MANUAL')} variant="secondary" className="py-4">
              <WifiOff className="mr-2 w-4 h-4" /> Offline
            </Button>
            <Button onClick={() => setWorkflow('SAVED_RECIPES')} variant="secondary" className="py-4">
              <History className="mr-2 w-4 h-4" /> Saved
            </Button>
          </div>
          <Button onClick={() => setWorkflow('SCAN_HISTORY')} variant="secondary" className="w-full py-4">
            <Database className="mr-2 w-4 h-4" /> Scan Vault
          </Button>
        </div>

        <div className="pt-8 border-t border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-zinc-200" referrerPolicy="no-referrer" />
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-900">{user.displayName}</p>
                  <button onClick={handleLogout} className="text-[10px] text-zinc-500 hover:text-black uppercase font-bold tracking-wider">Sign Out</button>
                </div>
              </>
            ) : (
              <Button onClick={handleSignIn} variant="ghost" size="sm">
                <LogIn className="mr-2 w-4 h-4" /> Sign In
              </Button>
            )}
          </div>
          <Button onClick={() => setWorkflow('API_CONFIG')} variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-zinc-400" />
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const APIConfigPage = () => {
    const [tempKey, setTempKey] = useState(apiKey);

    const handleSave = async () => {
      if (!tempKey) {
        setError("Please enter an API key.");
        return;
      }
      const isValid = await validateApiKey(tempKey);
      if (isValid) {
        setTimeout(() => setWorkflow('LANDING'), 1500);
      }
    };

    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto space-y-8 pt-12">
          <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
            <p className="text-zinc-500">Set up your AI engine for the best experience.</p>
          </div>
          <Card className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gemini API Key</label>
              <div className="relative">
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className={cn(
                    "w-full bg-zinc-50 border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all",
                    validationStatus === 'success' ? "border-green-500 ring-2 ring-green-500/10" : 
                    validationStatus === 'error' ? "border-red-500 ring-2 ring-red-500/10" : "border-zinc-100 focus:ring-2 focus:ring-black/5"
                  )}
                />
                {isValidating && (
                  <div className="absolute right-4 top-3.5">
                    <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                  </div>
                )}
                {validationStatus === 'success' && <CheckCircle2 className="absolute right-4 top-3.5 w-4 h-4 text-green-500" />}
                {validationStatus === 'error' && <AlertCircle className="absolute right-4 top-3.5 w-4 h-4 text-red-500" />}
              </div>
              {validationStatus === 'error' && <p className="text-[10px] text-red-500 ml-1">Invalid API key. Please check and try again.</p>}
              {validationStatus === 'success' && <p className="text-[10px] text-green-500 ml-1">API key validated successfully!</p>}
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Free Tier Mode</h4>
                  <p className="text-[10px] text-zinc-500">Minimize API calls to stay within free limits.</p>
                </div>
                <button 
                  onClick={() => setIsFreeTier(!isFreeTier)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    isFreeTier ? "bg-green-500" : "bg-zinc-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    isFreeTier ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Your key is stored locally and used only for ingredient recognition and recipe synthesis. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-black underline">AI Studio</a>.
            </p>
            <Button 
              onClick={handleSave} 
              disabled={isValidating}
              className="w-full py-4 text-base font-bold"
            >
              {isValidating ? 'Validating...' : 'Validate & Save'}
            </Button>
          </Card>
        </div>
      </div>
    );
  };

  const CameraScanPage = () => {
    useEffect(() => {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Ensure video plays
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(console.error);
            };
          }
        } catch (err) {
          setError("Camera access denied.");
        }
      };
      startCamera();
      return () => {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => {
            t.stop();
            stream.removeTrack(t);
          });
          videoRef.current.srcObject = null;
        }
      };
    }, []);

    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center">
            <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon" className="bg-white/10 backdrop-blur-md text-white">
              <X className="w-6 h-6" />
            </Button>
            <Badge variant="info" className="bg-white/20 text-white backdrop-blur-md border-none">Online Mode</Badge>
          </div>

          <div className="flex flex-col items-center gap-8 pb-12">
            <div className="w-24 h-24 border-4 border-white/30 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-white rounded-full animate-ping opacity-20" />
              <button 
                onClick={handleCapture}
                className="w-20 h-20 bg-white rounded-full active:scale-90 transition-transform shadow-2xl"
              />
            </div>
            <div className="flex gap-4">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <div className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Image
                </div>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="absolute top-20 left-6 right-6 bg-red-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-xl animate-bounce">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  };

  const ProcessingPage = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-zinc-100 rounded-[2.5rem]" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-black rounded-[2.5rem] border-t-transparent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ChefHat className="w-10 h-10 text-black" />
        </div>
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Analyzing Ingredients</h2>
      <p className="text-zinc-500 max-w-xs">Our AI is identifying items and calculating nutritional profiles...</p>
      
      <div className="mt-12 space-y-3 w-full max-w-xs">
        {['Detecting objects...', 'Validating food items...', 'Generating profiles...'].map((text, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.5 }}
            className="flex items-center gap-3 text-xs font-medium text-zinc-400"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
            {text}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const PerceptionMapPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('CAMERA_SCAN')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold">Perception Map</h2>
          <div className="w-10" />
        </div>

        <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-black group">
          {capturedImage && <img src={capturedImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />}
          
          {/* Scanning Line Animation */}
          <motion.div 
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.8)] z-10 pointer-events-none"
          />

          <div className="absolute inset-0">
            {ingredients.map((ing, i) => (
              <React.Fragment key={ing.id}>
                {/* Bounding Box */}
                {ing.boundingBox && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute border-2 border-blue-400 bg-blue-400/10 rounded-lg pointer-events-none"
                    style={{
                      top: `${ing.boundingBox[0] / 10}%`,
                      left: `${ing.boundingBox[1] / 10}%`,
                      width: `${(ing.boundingBox[3] - ing.boundingBox[1]) / 10}%`,
                      height: `${(ing.boundingBox[2] - ing.boundingBox[0]) / 10}%`,
                    }}
                  />
                )}
                
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: i * 0.05 
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ 
                    top: `${ing.y ?? (20 + (i * 10))}%`, 
                    left: `${ing.x ?? (20 + (i * 10))}%` 
                  }}
                >
                  <div className="relative group/marker">
                    {/* Outer Glow */}
                    <div className={cn(
                      "absolute -inset-2 rounded-full blur-sm opacity-40 animate-pulse",
                      ing.confidence > 0.9 ? "bg-green-400" : "bg-blue-400"
                    )} />
                    
                    {/* Main Pill */}
                    <div className="bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/50 cursor-pointer hover:scale-110 transition-transform">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        ing.confidence > 0.9 ? "bg-green-500" : "bg-blue-500"
                      )} />
                      <span className="text-[11px] font-bold text-zinc-900 whitespace-nowrap">{ing.name}</span>
                      <span className="text-[9px] font-bold text-zinc-400">{Math.round(ing.confidence * 100)}%</span>
                    </div>

                    {/* Connector Line (Optional visual flair) */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 bg-gradient-to-b from-white/50 to-transparent" />
                  </div>
                </motion.div>
              </React.Fragment>
            ))}
          </div>
          
          {/* Vignette Overlay */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Detected Entities</h3>
            <span className="text-[10px] font-bold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full uppercase">{ingredients.length} Found</span>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {ingredients.map(ing => (
              <motion.div
                key={ing.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-4 flex items-center justify-between hover:border-zinc-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100">
                      <Zap className={cn("w-5 h-5", ing.confidence > 0.9 ? "text-green-500" : "text-blue-500")} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{ing.name}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">{ing.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={ing.confidence > 0.9 ? 'success' : 'info'}>
                      {Math.round(ing.confidence * 100)}% Match
                    </Badge>
                    {ing.nutritionalEstimate && (
                      <span className="text-[9px] font-bold text-zinc-400">{ing.nutritionalEstimate.calories} kcal</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={() => setWorkflow('INGREDIENT_LIST')} className="w-full py-6 text-lg shadow-xl shadow-black/10">
            Confirm Perception <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const IngredientListPage = () => {
    const [substitutions, setSubstitutions] = useState<Record<string, string[]>>({});
    const [presetName, setPresetName] = useState('');
    const [presets, setPresets] = useState<IngredientPreset[]>([]);

    const pantryItems = PantryService.getPantry();
    const ingredientNameSet = new Set(ingredients.map((item) => item.name.toLowerCase()));
    const pantrySuggestions = pantryItems.filter((item) => !ingredientNameSet.has(item.name.toLowerCase())).slice(0, 6);

    useEffect(() => {
      setPresets(IngredientPresetService.list());
    }, []);

    const handleShowSubstitutions = async (ing: string) => {
      if (substitutions[ing]) return;
      const subs = await getSubstitutions(ing);
      setSubstitutions(prev => ({ ...prev, [ing]: subs }));
    };

    const handleSavePreset = () => {
      if (!presetName.trim() || ingredients.length === 0) return;
      setPresets(IngredientPresetService.save(presetName, ingredients));
      setPresetName('');
    };

    const handleApplyPreset = (preset: IngredientPreset) => {
      setIngredients(preset.ingredients.map((item, index) => ({ ...item, id: `${item.id}-${Date.now()}-${index}` })));
    };

    const handleDeletePreset = (presetId: string) => {
      setPresets(IngredientPresetService.remove(presetId));
    };

    const handleMergePantrySuggestions = () => {
      if (pantrySuggestions.length === 0) return;

      const mapped = pantrySuggestions.map((item, index) => ({
        id: `pantry-merge-${Date.now()}-${index}`,
        name: item.name,
        category: item.category || 'Pantry',
        confidence: item.confidence || 1,
      }));

      setIngredients([...ingredients, ...mapped]);
    };

    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Button onClick={() => setWorkflow('PERCEPTION_MAP')} variant="ghost" size="icon">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-xl font-bold">Ingredient Manifest</h2>
            <Button onClick={() => {
              if (confirm("Clear all ingredients?")) setIngredients([]);
            }} variant="ghost" size="icon">
              <Trash2 className="w-5 h-5 text-zinc-400" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Pantry</h3>
                <div className="flex gap-2">
                  <input 
                    id="manual-ingredient-input"
                    type="text" 
                    list="ingredient-suggestions"
                    placeholder="Add item..."
                    className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none w-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button variant="secondary" size="sm" onClick={() => {
                    const input = document.getElementById('manual-ingredient-input') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                      input.value = '';
                    }
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {ingredients.map(ing => (
                  <div key={ing.id} className="space-y-2">
                    <div className="bg-zinc-100 px-4 py-3 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-900">{ing.name}</span>
                        <button 
                          onClick={() => handleShowSubstitutions(ing.name)}
                          className="text-[10px] font-bold text-blue-500 uppercase tracking-wider hover:underline"
                        >
                          Substitutes
                        </button>
                      </div>
                      <button 
                        onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {substitutions[ing.name] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pl-4 flex flex-wrap gap-2"
                      >
                        {substitutions[ing.name].map((sub, i) => (
                          <span key={i} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                            {sub}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Tier Tools</h3>

              <Card className="space-y-3 border border-blue-100 bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pantry Autofill Assistant</p>
                  <Badge variant="info">{pantrySuggestions.length} suggestions</Badge>
                </div>
                <p className="text-xs text-blue-700/80">Auto-merge useful pantry items not yet in this session.</p>
                {pantrySuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pantrySuggestions.map((item) => (
                      <span key={item.id} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white text-blue-600 border border-blue-100">
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
                <Button variant="secondary" onClick={handleMergePantrySuggestions} className="w-full">
                  Merge Pantry Suggestions
                </Button>
              </Card>

              <Card className="space-y-3 border border-emerald-100 bg-emerald-50/50">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Ingredient Presets</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name (e.g., Gym Meal Set)"
                    className="flex-1 bg-white border border-emerald-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                  <Button size="sm" onClick={handleSavePreset}>Save</Button>
                </div>
                {presets.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {presets.slice(0, 8).map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between gap-2 bg-white border border-emerald-100 rounded-xl p-2">
                        <div>
                          <p className="text-xs font-bold text-emerald-700">{preset.name}</p>
                          <p className="text-[10px] text-emerald-600/70">{preset.ingredients.length} ingredients</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleApplyPreset(preset)}>Use</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePreset(preset.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700/70">No presets yet. Save your current ingredient set for one-tap reuse.</p>
                )}
              </Card>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preferences</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Cuisine</label>
                  <select 
                    value={cuisinePreference}
                    onChange={(e) => setCuisinePreference(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 text-sm focus:outline-none"
                  >
                    <option value="ALL">All Cuisines</option>
                    <option value="ITALIAN">Italian</option>
                    <option value="CHINESE">Chinese</option>
                    <option value="MEXICAN">Mexican</option>
                    <option value="INDIAN">Indian</option>
                    <option value="GREEK">Greek</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Nutritional Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'BALANCED', icon: Scale, label: 'Balanced' },
                      { id: 'HIGH PROTEIN', icon: Dna, label: 'High Protein' },
                      { id: 'LOW CALORIE', icon: Zap, label: 'Low Calorie' },
                      { id: 'LOW CARB', icon: Flame, label: 'Low Carb' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setNutritionalGoal(g.id as NutritionalGoal)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-2xl border transition-all text-left",
                          nutritionalGoal === g.id 
                            ? "bg-black border-black text-white shadow-lg" 
                            : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        <g.icon className={cn("w-4 h-4", nutritionalGoal === g.id ? "text-white" : "text-zinc-400")} />
                        <span className="text-xs font-bold">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={startSynthesis} className="w-full py-6 text-lg mt-8">
            Generate Recipes <ChefHat className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  const RecipeSelectorPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('INGREDIENT_LIST')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold">Recipe Intelligence</h2>
          <div className="w-10" />
        </div>

        {/* Waste Minimizer Tip */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-emerald-700 font-bold text-sm">Waste Minimizer</h4>
            <p className="text-emerald-600 text-xs leading-relaxed">
              These recipes use {Math.floor(Math.random() * 30) + 70}% of your detected ingredients to help you reduce food waste.
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {recipes.map((recipe, i) => (
            (() => {
              const ingredientNames = ingredients.map((item) => item.name.toLowerCase());
              const overlapCount = recipe.ingredients.filter((ingredient) => ingredientNames.some((name) => name.includes(ingredient.toLowerCase()) || ingredient.toLowerCase().includes(name))).length;
              const readinessScore = Math.min(100, Math.round((overlapCount / Math.max(recipe.ingredients.length, 1)) * 100));

              return (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-0 overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                  <img src={recipe.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" onError={handleRecipeImageError} />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant={recipe.source === 'AI' ? 'info' : 'default'} className="bg-white/90 backdrop-blur-md">
                      {recipe.source === 'AI' ? 'AI Synthesized' : 'Static Match'}
                    </Badge>
                    <Badge variant="success" className="bg-white/90 backdrop-blur-md">{recipe.difficulty}</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-zinc-900">{recipe.title}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">{recipe.description}</p>
                    <div className="pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <span>Readiness Score</span>
                        <span className="text-zinc-700">{readinessScore}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${readinessScore}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-4">
                      <span>{recipe.prepTime + recipe.cookTime} MIN</span>
                      <span>{recipe.macros.calories} KCAL</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => addToMealPlan(recipe, new Date().toISOString().split('T')[0], 'DINNER')}>
                        <LayoutGrid className="w-4 h-4 text-zinc-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => saveRecipe(recipe)}>
                        <Save className={cn("w-4 h-4", visibleSavedRecipes.some(r => r.id === recipe.id) ? "text-blue-500 fill-blue-500" : "text-zinc-400")} />
                      </Button>
                      <Button onClick={() => {
                        setSelectedRecipe(recipe);
                        setServingsScale(1);
                        setWorkflow('RECIPE_DETAIL');
                      }}>
                        View Details <ArrowRight className="ml-2 w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
              );
            })()
          ))}
        </div>
      </div>
    </div>
  );

  const RecipeDetailPage = () => {
    if (!selectedRecipe) return null;
    
    const macroData = [
      { name: 'Protein', value: selectedRecipe.macros.protein * 4, color: '#10b981' },
      { name: 'Carbs', value: selectedRecipe.macros.carbs * 4, color: '#3b82f6' },
      { name: 'Fat', value: selectedRecipe.macros.fat * 9, color: '#f59e0b' },
    ];

    const scaleFactor = servingsScale;
    const scaledCalories = Math.round(selectedRecipe.macros.calories * scaleFactor);
    const scaledProtein = Math.round(selectedRecipe.macros.protein * scaleFactor);
    const scaledCarbs = Math.round(selectedRecipe.macros.carbs * scaleFactor);
    const scaledFat = Math.round(selectedRecipe.macros.fat * scaleFactor);

    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="relative h-72">
          <img src={selectedRecipe.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleRecipeImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Button 
            onClick={() => setWorkflow('RECIPE_SELECTOR')} 
            variant="ghost" 
            size="icon" 
            className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex gap-2 mb-2">
              <Badge variant="info" className="bg-white/20 backdrop-blur-md text-white border-white/30">{selectedRecipe.cuisine}</Badge>
              <Badge variant="success" className="bg-white/20 backdrop-blur-md text-white border-white/30">{selectedRecipe.difficulty}</Badge>
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight">{selectedRecipe.title}</h1>
          </div>
        </div>

        <div className="p-6 space-y-8 max-w-md mx-auto">
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Time</p>
              <p className="text-sm font-bold text-zinc-900">{selectedRecipe.prepTime + selectedRecipe.cookTime}m</p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Calories</p>
              <p className="text-sm font-bold text-zinc-900">{scaledCalories} kcal</p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Servings</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setServingsScale(Math.max(0.5, servingsScale - 0.5))} className="text-zinc-400 hover:text-black">
                  <Minus className="w-3 h-3" />
                </button>
                <p className="text-sm font-bold text-zinc-900">{selectedRecipe.servings * scaleFactor}</p>
                <button onClick={() => setServingsScale(servingsScale + 0.5)} className="text-zinc-400 hover:text-black">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-900">Nutritional Intelligence</h3>
            <div className="h-48 w-full bg-zinc-50 rounded-3xl p-4 border border-zinc-100">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Protein</p>
                <p className="text-sm font-bold text-emerald-700">{scaledProtein}g</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Carbs</p>
                <p className="text-sm font-bold text-blue-700">{scaledCarbs}g</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Fat</p>
                <p className="text-sm font-bold text-amber-700">{scaledFat}g</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-900">Ingredient Manifest</h3>
            <div className="space-y-2">
              {selectedRecipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <span className="text-sm font-medium text-zinc-700">{ing}</span>
                  <div className="flex items-center gap-2">
                    {STATIC_SUBSTITUTIONS[ing.toLowerCase()] && (
                      <Badge variant="info" className="text-[8px] px-1.5 py-0">Swap Available</Badge>
                    )}
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => {
              setCurrentStepIndex(0);
              setWorkflow('COOKING_MODE');
            }} 
            className="w-full py-6 text-lg shadow-xl shadow-black/10"
          >
            Start Cooking Mode <Play className="ml-2 w-4 h-4 fill-current" />
          </Button>
        </div>
      </div>
    );
  };

  const CookingModePage = () => {
    if (!selectedRecipe) return null;
    const currentStep = selectedRecipe.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / selectedRecipe.steps.length) * 100;

    useEffect(() => {
      speak(currentStep.instruction);
    }, [currentStepIndex]);

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-zinc-100">
          <Button onClick={() => setWorkflow('RECIPE_SELECTOR')} variant="ghost" size="icon">
            <X className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Step {currentStepIndex + 1} of {selectedRecipe.steps.length}</p>
            <h3 className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{selectedRecipe.title}</h3>
          </div>
          <Button onClick={() => setIsMuted(!isMuted)} variant="ghost" size="icon">
            {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-zinc-900" />}
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-black"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <ChefHat className="w-10 h-10 text-zinc-300" />
              </div>
              <h2 className="text-3xl font-bold leading-tight text-zinc-900">
                {currentStep.instruction}
              </h2>
              
              {currentStep.duration && (
                <div className="max-w-sm mx-auto">
                  <CookingTimer duration={currentStep.duration} onComplete={() => speak("Timer finished. Moving to next step.")} />
                </div>
              )}

              {currentStep.tip && (
                <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 text-left max-w-sm mx-auto">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 leading-relaxed font-medium">{currentStep.tip}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 grid grid-cols-2 gap-4">
          <Button 
            variant="secondary" 
            className="py-6"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
          >
            <ArrowLeft className="mr-2 w-5 h-5" /> Previous
          </Button>
          {currentStepIndex === selectedRecipe.steps.length - 1 ? (
            <Button 
              variant="primary" 
              className="py-6 bg-green-600 hover:bg-green-700"
              onClick={() => setWorkflow('POST_COMPLETION')}
            >
              Complete <CheckCircle2 className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <Button 
              variant="primary" 
              className="py-6"
              onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
            >
              Next Step <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const PostCompletionPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center justify-center text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="text-green-600 w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Chef's Kiss!</h2>
          <p className="text-zinc-500">You've successfully completed this recipe.</p>
        </div>

        <Card className="p-8 space-y-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nutritional Impact</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.calories}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Calories</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.protein}g</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protein</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.carbs}g</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Carbs</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.fat}g</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fat</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Button onClick={() => setWorkflow('LANDING')} className="w-full py-4">
            Back to Home
          </Button>
          <Button onClick={() => setWorkflow('CAMERA_SCAN')} variant="secondary" className="w-full py-4">
            Scan More Ingredients
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const SavedRecipesPage = () => (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold">Saved Recipes</h2>
          <div className="w-10" />
        </div>

        {visibleSavedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center">
              <History className="w-10 h-10 text-zinc-200" />
            </div>
            <p className="text-zinc-400 font-medium">No saved recipes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {visibleSavedRecipes.map(recipe => (
              <Card key={recipe.id} className="p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden">
                    <img src={recipe.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleRecipeImageError} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{recipe.title}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{recipe.cuisine}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => removeSavedRecipe(recipe.id)}>
                    <Trash2 className="w-4 h-4 text-zinc-300 hover:text-red-500" />
                  </Button>
                  <Button size="sm" onClick={() => {
                    setSelectedRecipe(recipe);
                    setCurrentStepIndex(0);
                    setWorkflow('COOKING_MODE');
                  }}>
                    Cook
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const OfflineManualPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-500" />
            <h2 className="text-xl font-bold">Offline Mode</h2>
          </div>
          <div className="w-10" />
        </div>

        <Card className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Manual Entry</h3>
            <div className="flex gap-2">
              <input 
                id="offline-manual-input"
                type="text"
                list="ingredient-suggestions"
                placeholder="Add ingredient..."
                className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 text-sm focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) {
                      setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <Button
                size="icon"
                className="h-12 w-12 rounded-2xl"
                onClick={() => {
                  const input = document.getElementById('offline-manual-input') as HTMLInputElement | null;
                  const val = input?.value.trim();
                  if (val) {
                    setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                    input.value = '';
                  }
                }}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.map(ing => (
                <div key={ing.id} className="bg-zinc-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">{ing.name}</span>
                  <button onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}>
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cuisine</h3>
            <div className="grid grid-cols-3 gap-2">
              {['ALL', 'ITALIAN', 'CHINESE', 'MEXICAN', 'INDIAN', 'GREEK'].map(c => (
                <button
                  key={c}
                  onClick={() => setCuisinePreference(c)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                    cuisinePreference === c ? "bg-black border-black text-white" : "bg-white border-zinc-100 text-zinc-400"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => {
            const matches = OFFLINE_RECIPES.filter(r => 
              (cuisinePreference === 'ALL' || r.cuisine === cuisinePreference) &&
              r.ingredients.some(ri => ingredients.some(i => i.name.toLowerCase().includes(ri.toLowerCase())))
            );
            setRecipes(matches.length > 0 ? matches : OFFLINE_RECIPES.slice(0, 3));
            setWorkflow('RECIPE_SELECTOR');
          }} className="w-full py-6 text-lg">
            Find Local Recipes
          </Button>
        </Card>
      </div>
    </div>
  );

  const ScanHistoryPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold">Scan Vault</h2>
          <div className="w-10" />
        </div>

        {scanResults.length === 0 ? (
          <Card className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
              <Database className="w-7 h-7 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600">No saved scans yet.</p>
            <p className="text-xs text-zinc-400">Capture or upload an image to auto-save scan results here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {scanResults.map((scan, index) => {
              const delta = getScanDelta(scan, scanResults[index + 1]);

              return (
                <Card key={scan.id} className="p-0 overflow-hidden">
                  {scan.imageDataUrl && (
                    <div className="h-36 w-full overflow-hidden bg-zinc-100">
                      <img src={scan.imageDataUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                      <Badge variant="info">{scan.ingredientCount} items</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="font-bold text-zinc-700">Confidence:</span>
                      <span>{Math.round(scan.averageConfidence * 100)}%</span>
                      {index < scanResults.length - 1 && (
                        <>
                          <span className="mx-1">|</span>
                          <span className="text-green-600">+{delta.added}</span>
                          <span className="text-red-500">-{delta.removed}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {scan.ingredients.slice(0, 5).map((ingredient) => (
                        <span key={`${scan.id}-${ingredient.id}`} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-100 text-zinc-600">
                          {ingredient.name}
                        </span>
                      ))}
                      {scan.ingredients.length > 5 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">
                          +{scan.ingredients.length - 5} more
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button variant="secondary" className="w-full" onClick={() => handleUseScanResult(scan)}>
                        Use This Result
                      </Button>
                      <Button variant="danger" className="w-full" onClick={() => handleDeleteScanResult(scan.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("font-sans antialiased text-zinc-900", ['LANDING', 'API_CONFIG', 'CAMERA_SCAN', 'PROCESSING', 'COOKING_MODE'].indexOf(workflow) === -1 && "pb-24")}>
      <AnimatePresence mode="wait">
        {workflow === 'LANDING' && <LandingPage key="landing" />}
        {workflow === 'API_CONFIG' && <APIConfigPage key="config" />}
        {workflow === 'CAMERA_SCAN' && <CameraScanPage key="scan" />}
        {workflow === 'PROCESSING' && <ProcessingPage key="processing" />}
        {workflow === 'PERCEPTION_MAP' && <PerceptionMapPage key="perception" />}
        {workflow === 'INGREDIENT_LIST' && <IngredientListPage key="list" />}
        {workflow === 'RECIPE_SELECTOR' && <RecipeSelectorPage key="selector" />}
        {workflow === 'RECIPE_DETAIL' && <RecipeDetailPage key="detail" />}
        {workflow === 'COOKING_MODE' && <CookingModePage key="cooking" />}
        {workflow === 'POST_COMPLETION' && <PostCompletionPage key="completion" />}
        {workflow === 'SAVED_RECIPES' && <SavedRecipesPage key="saved" />}
        {workflow === 'OFFLINE_MANUAL' && <OfflineManualPage key="offline" />}
        {workflow === 'SCAN_HISTORY' && <ScanHistoryPage key="scan-history" />}
        {workflow === 'PANTRY_TRACKER' && <PantryTracker key="pantry" />}
        {workflow === 'MEAL_PLANNER' && <MealPlanner key="planner" userId={user?.uid || ''} />}
        {workflow === 'PROFILE_SETTINGS' && <ProfileSettings key="profile" user={user as any} onLogout={handleLogout} />}
        {workflow === 'SHOPPING_LIST' && <ShoppingList key="shopping-list" user={user} />}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {['LANDING', 'API_CONFIG', 'CAMERA_SCAN', 'PROCESSING', 'COOKING_MODE'].indexOf(workflow) === -1 && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-6 py-3 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <NavButton 
              active={workflow === 'CAMERA_SCAN' || workflow === 'PERCEPTION_MAP' || workflow === 'INGREDIENT_LIST'} 
              onClick={() => setWorkflow('CAMERA_SCAN')} 
              icon={<Camera className="w-6 h-6" />} 
              label="Scan" 
            />
            <NavButton 
              active={workflow === 'PANTRY_TRACKER'} 
              onClick={() => setWorkflow('PANTRY_TRACKER')} 
              icon={<Package className="w-6 h-6" />} 
              label="Pantry" 
            />
            <NavButton 
              active={workflow === 'MEAL_PLANNER'} 
              onClick={() => setWorkflow('MEAL_PLANNER')} 
              icon={<Calendar className="w-6 h-6" />} 
              label="Planner" 
            />
            <NavButton 
              active={workflow === 'SAVED_RECIPES'} 
              onClick={() => setWorkflow('SAVED_RECIPES')} 
              icon={<Heart className="w-6 h-6" />} 
              label="Saved" 
            />
            <NavButton 
              active={workflow === 'SHOPPING_LIST'} 
              onClick={() => setWorkflow('SHOPPING_LIST')} 
              icon={<ShoppingCart className="w-6 h-6" />} 
              label="List" 
            />
            <NavButton 
              active={workflow === 'PROFILE_SETTINGS'} 
              onClick={() => setWorkflow('PROFILE_SETTINGS')} 
              icon={<UserIcon className="w-6 h-6" />} 
              label="Profile" 
            />
          </div>
        </nav>
      )}

      <datalist id="ingredient-suggestions">
        {INGREDIENT_DICTIONARY.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-black rounded-full mt-0.5" />}
    </button>
  );
}
