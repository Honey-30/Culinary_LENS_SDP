import React, { useState, useEffect } from 'react';
import { ShoppingListService } from '../services/shoppingListService';
import { InstamartService } from '../services/instamartService';
import { ShoppingListItem } from '../types';
import { User } from 'firebase/auth';
import { Check, PlusCircle, Trash2, ShoppingBag } from 'lucide-react';
import { getIngredientSuggestions } from '../services/ingredientSuggestionService';

interface ShoppingListProps {
    user: User | null;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ user }) => {
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const userId = user?.uid || '';

    const fetchItems = () => {
        ShoppingListService.getShoppingList(userId).then(setItems);
    };

    useEffect(() => {
        fetchItems();
    }, [userId]);

    useEffect(() => {
        if (!newItemName.trim()) {
            setSuggestions([]);
            return;
        }

        setSuggestions(getIngredientSuggestions(newItemName));
    }, [newItemName]);

    const handleAddItem = async () => {
        if (newItemName.trim() !== '') {
            setIsAdding(true);
            const newItem: Omit<ShoppingListItem, 'id' | 'isChecked'> = {
                name: newItemName,
                quantity: 1,
                unit: 'unit',
            };
            await ShoppingListService.addIngredientsToShoppingList(userId, [newItem]);
            setNewItemName('');
            setSuggestions([]);
            fetchItems();
            setIsAdding(false);
        }
    };

    const handleToggleItem = async (item: ShoppingListItem) => {
        await ShoppingListService.updateShoppingListItem(userId, item.id, { isChecked: !item.isChecked });
        fetchItems();
    };

    const handleBuyItem = async (item: ShoppingListItem) => {
        // Mark item as checked/purchased first
        await ShoppingListService.updateShoppingListItem(userId, item.id, { isChecked: true });
        
        // Open Instamart with the product
        InstamartService.openInstamart(item.name);
        
        // Refresh list to show updated state
        fetchItems();
    };
    
    const handleClearChecked = async () => {
        await ShoppingListService.clearCheckedItems(userId);
        fetchItems();
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Shopping List</h2>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Add a new item..."
                            className="flex-grow p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                            disabled={isAdding}
                        />
                        <button 
                            onClick={handleAddItem} 
                            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                            disabled={isAdding}
                        >
                            {isAdding ? '...' : <PlusCircle size={24} />}
                        </button>
                    </div>
                    {suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setNewItemName(suggestion)}
                                    className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    {items.length > 0 ? (
                        <ul>
                            {items.map(item => (
                                <li key={item.id} className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 transition-all ${item.isChecked ? 'opacity-50' : ''}`}>
                                    <button onClick={() => handleToggleItem(item)} className="flex-shrink-0">
                                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${item.isChecked ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-gray-400'}`}>
                                            {item.isChecked && <Check size={18} className="text-white" />}
                                        </div>
                                    </button>
                                    <span className={`flex-grow ${item.isChecked ? 'line-through text-gray-500' : 'text-gray-700'}`}>{item.name}</span>
                                    <span className="text-sm text-gray-400">{item.quantity} {item.unit}</span>
                                    {!item.isChecked && (
                                        <button 
                                            onClick={() => handleBuyItem(item)}
                                            className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                                            title="Buy on Instamart"
                                        >
                                            <ShoppingBag size={18} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>Your shopping list is empty.</p>
                            <p className="text-sm">Add items using the input above.</p>
                        </div>
                    )}
                </div>
                {items.some(item => item.isChecked) && (
                    <button 
                        onClick={handleClearChecked} 
                        className="mt-6 w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        Clear Checked Items
                    </button>
                )}
            </div>
        </div>
    );
};
