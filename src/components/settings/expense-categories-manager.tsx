"use client";

import { useState } from "react";
import { useData } from "@/context/data-context";
import { Plus, Trash2, Edit2, FolderTree, ChevronRight, ChevronDown, Folder, Tag } from "lucide-react";
import type { ExpenseCategoryItem } from "@/types";

export function ExpenseCategoriesManager() {
    const { expenseCategories, addExpenseCategory, deleteExpenseCategory, updateExpenseCategory } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [addingSubToId, setAddingSubToId] = useState<string | null>(null);

    // Form States
    const [newName, setNewName] = useState("");
    const [parentId, setParentId] = useState<string | undefined>(undefined);

    // Tree Expansion State
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAdd = async (parent?: string) => {
        if (!newName.trim()) return;
        try {
            await addExpenseCategory({ name: newName, parentId: parent });
            setNewName("");
            setIsAdding(false);
            setAddingSubToId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!newName.trim()) return;
        try {
            await updateExpenseCategory(id, { name: newName });
            setNewName("");
            setEditingId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar estación categoría? Se desvincularán los gastos asociados.")) {
            await deleteExpenseCategory(id);
        }
    };

    const startEditing = (category: ExpenseCategoryItem) => {
        setEditingId(category.id);
        setNewName(category.name);
        setIsAdding(false);
        setAddingSubToId(null);
    };

    const startAdding = (parent?: string) => {
        setNewName("");
        if (parent) {
            setAddingSubToId(parent);
            setIsAdding(false);
            // Ensure parent is expanded
            setExpanded(prev => ({ ...prev, [parent]: true }));
        } else {
            setIsAdding(true);
            setAddingSubToId(null);
        }
        setEditingId(null);
    };

    // Build Tree
    const rootCategories = expenseCategories.filter(exc => !exc.parentId);
    const getChildren = (parentId: string) => expenseCategories.filter(exc => exc.parentId === parentId);

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FolderTree className="text-indigo-600" size={24} />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Categorías de Gastos</h2>
                        <p className="text-sm text-gray-500">Gestiona la estructura de tus gastos</p>
                    </div>
                </div>
                <button
                    onClick={() => startAdding()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    Nueva Categoría Principal
                </button>
            </div>

            <div className="p-6 bg-muted/50 min-h-[300px]">
                {/* Main Add Form */}
                {isAdding && (
                    <div className="mb-4 bg-card p-4 rounded-lg border border-border shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <Folder size={20} className="text-indigo-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nombre de la categoría principal..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <div className="flex items-center gap-1">
                            <button onClick={() => handleAdd()} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Plus size={18} /></button>
                            <button onClick={() => setIsAdding(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><Trash2 size={18} /></button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {rootCategories.map(root => (
                        <CategoryItem
                            key={root.id}
                            category={root}
                            allCategories={expenseCategories}
                            onToggle={(id) => toggleExpand(id)}
                            isExpanded={!!expanded[root.id]}
                            onAddSub={(id) => startAdding(id)}
                            onEdit={(cat) => startEditing(cat)}
                            onDelete={(id) => handleDelete(id)}
                            addingSubToId={addingSubToId}
                            editingId={editingId}
                            newName={newName}
                            setNewName={setNewName}
                            onSaveAddSub={(parentId) => handleAdd(parentId)}
                            onSaveEdit={(id) => handleUpdate(id)}
                            onCancel={() => { setAddingSubToId(null); setEditingId(null); }}
                        />
                    ))}
                    {rootCategories.length === 0 && !isAdding && (
                        <div className="text-center py-8 text-gray-400">
                            <p>No hay categorías definidas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Recursive Component for Tree
interface CategoryItemProps {
    category: ExpenseCategoryItem;
    allCategories: ExpenseCategoryItem[];
    onToggle: (id: string) => void;
    isExpanded: boolean;
    onAddSub: (id: string) => void;
    onEdit: (cat: ExpenseCategoryItem) => void;
    onDelete: (id: string) => void;

    // Edit/Add States passed down
    addingSubToId: string | null;
    editingId: string | null;
    newName: string;
    setNewName: (s: string) => void;
    onSaveAddSub: (parentId: string) => void;
    onSaveEdit: (id: string) => void;
    onCancel: () => void;
    level?: number;
}

function CategoryItem({
    category, allCategories, onToggle, isExpanded, onAddSub, onEdit, onDelete,
    addingSubToId, editingId, newName, setNewName, onSaveAddSub, onSaveEdit, onCancel, level = 0
}: CategoryItemProps) {
    const children = allCategories.filter(c => c.parentId === category.id);
    const hasChildren = children.length > 0;
    const isEditing = editingId === category.id;
    const isAddingChild = addingSubToId === category.id;

    return (
        <div className="space-y-1">
            <div
                className={`group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-gray-200 hover:shadow-sm transition-all ${isEditing ? 'bg-card border-border' : ''}`}
                style={{ marginLeft: `${level * 24}px` }}
            >
                <div className="flex items-center gap-2 flex-1">
                    {/* Expand/Collapse */}
                    <button
                        onClick={() => onToggle(category.id)}
                        className={`p-1 rounded hover:bg-gray-200 text-gray-400 ${hasChildren ? 'visible' : 'invisible'}`}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {/* Icon */}
                    {level === 0 ? <Folder size={18} className="text-indigo-500" /> : <Tag size={16} className="text-slate-400" />}

                    {/* Name or Edit Input */}
                    {isEditing ? (
                        <input
                            autoFocus
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveEdit(category.id);
                                if (e.key === 'Escape') onCancel();
                            }}
                        />
                    ) : (
                        <span className={`text-sm ${level === 0 ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                            {category.name}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isEditing || isAddingChild ? 'opacity-100' : ''}`}>
                    {isEditing ? (
                        <>
                            <button onClick={() => onSaveEdit(category.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Plus size={14} /></button>
                            <button onClick={onCancel} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><Trash2 size={14} /></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onAddSub(category.id)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded" title="Agregar Subcategoría">
                                <Plus size={14} />
                            </button>
                            <button onClick={() => onEdit(category)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-muted/50 rounded">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => onDelete(category.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Add Subcategory Form */}
            {isAddingChild && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border ml-8 animate-in fade-in slide-in-from-top-1">
                    <Tag size={16} className="text-indigo-400" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Nombre de la subcategoría..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && onSaveAddSub(category.id)}
                    />
                    <button onClick={() => onSaveAddSub(category.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Plus size={16} /></button>
                    <button onClick={onCancel} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><Trash2 size={16} /></button>
                </div>
            )}

            {/* Render Children */}
            {isExpanded && hasChildren && (
                <div>
                    {children.map(child => (
                        <CategoryItem
                            key={child.id}
                            category={child}
                            allCategories={allCategories}
                            onToggle={onToggle}
                            isExpanded={!!onToggle} // Children don't expand further in this simple version, or keep recursive prop
                            // Actually, sub-categories could assume they don't have children for now as per requirements "Category -> Subcategory", 2 levels.
                            // But I will keep it recursive just in case.
                            onAddSub={onAddSub}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            addingSubToId={addingSubToId}
                            editingId={editingId}
                            newName={newName}
                            setNewName={setNewName}
                            onSaveAddSub={onSaveAddSub}
                            onSaveEdit={onSaveEdit}
                            onCancel={onCancel}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
