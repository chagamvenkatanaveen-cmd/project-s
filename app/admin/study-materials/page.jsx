'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react';

const emptyTopic = { name: '', link: '', description: '' };
const emptyInternalTopic = { name: '', link: '', description: '' };
const emptySubtopic = { name: '', link: '', description: '' };

export default function AdminStudyMaterialsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState(emptyTopic);
  const [internalTopic, setInternalTopic] = useState(emptyInternalTopic);
  const [subtopic, setSubtopic] = useState(emptySubtopic);
  const [isTopicFormOpen, setIsTopicFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInternalTopicFormOpen, setIsInternalTopicFormOpen] = useState(false);
  const [openSubtopicLists, setOpenSubtopicLists] = useState({});
  const [addingSubtopicToId, setAddingSubtopicToId] = useState('');
  const [isSavingInternalTopic, setIsSavingInternalTopic] = useState(false);
  const [isSavingSubtopic, setIsSavingSubtopic] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editForm, setEditForm] = useState(emptyTopic);
  const [isUpdatingTopic, setIsUpdatingTopic] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadTopics() {
      try {
        const response = await fetch('/api/admin/study-material-topics', { signal: controller.signal });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load topics.');
        }
        setTopics(result.topics);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError.message || 'Unable to load topics.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    loadTopics();
    return () => controller.abort();
  }, [router]);

  function updateTopic(event) {
    const { name, value } = event.target;
    setTopic((current) => ({ ...current, [name]: value }));
  }

  function updateInternalTopic(event) {
    const { name, value } = event.target;
    setInternalTopic((current) => ({ ...current, [name]: value }));
  }

  function updateSubtopic(event) {
    const { name, value } = event.target;
    setSubtopic((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      const topicResponse = await fetch('/api/admin/study-material-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topic),
      });
      const topicResult = await topicResponse.json();
      if (topicResponse.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!topicResponse.ok || !topicResult.success) {
        throw new Error(topicResult.error || 'Unable to add the topic.');
      }

      setTopics((current) => [topicResult.topic, ...current]);
      setTopic(emptyTopic);
      setIsTopicFormOpen(false);
      setNotice(`Topic "${topicResult.topic.name}" was added.`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to add the topic.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddInternalTopic(event) {
    event.preventDefault();
    if (!selectedTopic) return;
    setError('');
    setNotice('');
    setIsSavingInternalTopic(true);
    try {
      const response = await fetch('/api/admin/study-material-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...internalTopic, parentId: selectedTopic.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to add the internal topic.');
      }
      setTopics((current) => [result.topic, ...current]);
      setInternalTopic(emptyInternalTopic);
      setIsInternalTopicFormOpen(false);
      setNotice(`Internal topic "${result.topic.name}" was added to ${selectedTopic.name}.`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to add the internal topic.');
    } finally {
      setIsSavingInternalTopic(false);
    }
  }

  async function handleAddSubtopic(event, parentTopic) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSavingSubtopic(true);
    try {
      const response = await fetch('/api/admin/study-material-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subtopic, parentId: parentTopic.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to add the subtopic.');
      }
      setTopics((current) => [result.topic, ...current]);
      setSubtopic(emptySubtopic);
      setAddingSubtopicToId('');
      setOpenSubtopicLists((current) => ({ ...current, [parentTopic.id]: true }));
      setNotice(`Subtopic "${result.topic.name}" was added to ${parentTopic.name}.`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to add the subtopic.');
    } finally {
      setIsSavingSubtopic(false);
    }
  }

  async function handleDelete() {
    if (!topicToDelete) return;
    setError('');
    setNotice('');
    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/study-material-topics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: topicToDelete.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to delete the topic.');
      }
      setTopics((current) => {
        const deletedIds = new Set([topicToDelete.id]);
        let foundDescendant = true;
        while (foundDescendant) {
          foundDescendant = false;
          current.forEach((item) => {
            if (deletedIds.has(item.parentId) && !deletedIds.has(item.id)) {
              deletedIds.add(item.id);
              foundDescendant = true;
            }
          });
        }
        return current.filter((item) => !deletedIds.has(item.id));
      });
      setNotice(`Topic "${topicToDelete.name}" was removed.`);
      setTopicToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete the topic.');
    } finally {
      setIsDeleting(false);
    }
  }

  function startEditTopic(item) {
    setEditingTopic(item);
    setEditForm({ name: item.name, link: item.link || '', description: item.description || '' });
    setError('');
    setNotice('');
  }

  async function handleEditTopic(event) {
    event.preventDefault();
    if (!editingTopic) return;
    setError('');
    setNotice('');
    setIsUpdatingTopic(true);
    try {
      const response = await fetch('/api/admin/study-material-topics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, id: editingTopic.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update the topic.');
      }
      setTopics((current) => current.map((item) => (item.id === result.topic.id ? result.topic : item)));
      setNotice(`Topic "${result.topic.name}" was updated.`);
      setEditingTopic(null);
    } catch (updateError) {
      setError(updateError.message || 'Unable to update the topic.');
    } finally {
      setIsUpdatingTopic(false);
    }
  }

  const parentTopics = topics.filter((item) => !item.parentId);
  const selectedTopic = parentTopics.find((item) => item.id === selectedTopicId);
  const selectedInternalTopics = selectedTopic
    ? topics.filter((item) => item.parentId === selectedTopic.id)
    : [];

  function renderTopicDropdown(item, depth = 1) {
    const children = topics.filter((child) => child.parentId === item.id);
    const isOpen = Boolean(openSubtopicLists[item.id]);
    const isAddingChild = addingSubtopicToId === item.id;

    return (
      <li key={item.id} className="rounded-xl border border-[#e5e7eb] bg-white p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenSubtopicLists((current) => ({ ...current, [item.id]: !current[item.id] }))}
            aria-expanded={isOpen}
            aria-controls={`nested-topics-${item.id}`}
            className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg p-2 text-left hover:bg-[#f9fafb]"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold">{item.name}</span>
              <span className="mt-0.5 block text-xs text-[#6b7280]">
                {children.length} nested topic{children.length === 1 ? '' : 's'}
              </span>
            </span>
            <ChevronDown size={17} className={`shrink-0 text-[#6b7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingSubtopicToId((current) => current === item.id ? '' : item.id);
              setSubtopic(emptySubtopic);
              setOpenSubtopicLists((current) => ({ ...current, [item.id]: true }));
            }}
            className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
          >
            {isAddingChild ? 'Cancel' : 'Add Topic'}
          </button>
          <button type="button" onClick={() => startEditTopic(item)} aria-label={`Edit ${item.name}`} className="rounded-lg border border-[#e5e7eb] p-2 text-[#6b7280] hover:bg-[#f9fafb]">
            <Pencil size={16} />
          </button>
          <button type="button" onClick={() => setTopicToDelete(item)} aria-label={`Delete ${item.name}`} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50">
            <Trash2 size={16} />
          </button>
        </div>
        <div id={`nested-topics-${item.id}`} hidden={!isOpen} className="mt-3 border-l-2 border-[#e5e7eb] pl-4">
          {item.description && <p className="mb-3 text-sm text-[#6b7280]">{item.description}</p>}
          {item.link && (
            <div className="mb-3">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm font-semibold text-emerald-700 hover:underline">
                {item.link} <ExternalLink size={14} className="shrink-0" />
              </a>
            </div>
          )}
          {isAddingChild && (
            <form onSubmit={(event) => handleAddSubtopic(event, item)} className="mb-3 rounded-xl bg-[#fafafa] p-4">
              <h5 className="font-semibold">Add a topic under {item.name}</h5>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input
                  name="name"
                  value={subtopic.name}
                  onChange={updateSubtopic}
                  maxLength={120}
                  required
                  placeholder="Topic name"
                  className="rounded-lg border border-[#d1d5db] px-3 py-2.5 outline-none focus:border-[#1f2937]"
                />
                <input
                  type="url"
                  name="link"
                  value={subtopic.link}
                  onChange={updateSubtopic}
                  maxLength={2048}
                  placeholder="Link (optional): https://..."
                  className="rounded-lg border border-[#d1d5db] px-3 py-2.5 outline-none focus:border-[#1f2937]"
                />
                <textarea
                  name="description"
                  value={subtopic.description}
                  onChange={updateSubtopic}
                  maxLength={500}
                  rows={2}
                  placeholder="Description"
                  className="resize-none rounded-lg border border-[#d1d5db] px-3 py-2.5 outline-none focus:border-[#1f2937] md:col-span-2"
                />
              </div>
              <button type="submit" disabled={isSavingSubtopic} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Plus size={17} />
                {isSavingSubtopic ? 'Adding...' : 'Add Topic'}
              </button>
            </form>
          )}
          {children.length > 0 && (
            <ul className={`space-y-3 ${depth > 1 ? 'mt-3' : ''}`}>
              {children.map((child) => renderTopicDropdown(child, depth + 1))}
            </ul>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#6b7280]">Create subjects, then open a subject to add its internal topics.</p>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

      <button
        type="button"
        onClick={() => setIsTopicFormOpen((isOpen) => !isOpen)}
        aria-expanded={isTopicFormOpen}
        className="inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-4 py-2.5 text-sm font-bold text-white"
      >
        <Plus size={17} />
        {isTopicFormOpen ? 'Cancel Add Topic' : 'Add Topic'}
      </button>

      {isTopicFormOpen && (
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <h2 className="text-lg font-bold">Add Topic</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#374151]">
            Topic Name
            <input
              name="name"
              value={topic.name}
              onChange={updateTopic}
              maxLength={120}
              required
              placeholder="AIML"
              className="mt-2 w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 font-normal outline-none focus:border-[#1f2937]"
            />
          </label>
          <label className="text-sm font-semibold text-[#374151]">
            Link (optional)
            <input
              type="url"
              name="link"
              value={topic.link}
              onChange={updateTopic}
              maxLength={2048}
              placeholder="Link (optional): https://..."
              className="mt-2 w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 font-normal outline-none focus:border-[#1f2937]"
            />
          </label>
          <label className="text-sm font-semibold text-[#374151] md:col-span-2">
            Description
            <textarea
              name="description"
              value={topic.description}
              onChange={updateTopic}
              maxLength={500}
              rows={3}
              placeholder="About this topic"
              className="mt-2 w-full resize-none rounded-lg border border-[#d1d5db] px-3 py-2.5 font-normal outline-none focus:border-[#1f2937]"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            <Plus size={17} />
            {isSaving ? 'Adding...' : 'Add Topic'}
          </button>
        </div>
      </form>
      )}

      {selectedTopic ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                setSelectedTopicId('');
                setAddingSubtopicToId('');
                setSubtopic(emptySubtopic);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
            >
              <ArrowLeft size={16} />
              Back to topics
            </button>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{selectedTopic.name}</h2>
                {selectedTopic.description && <p className="mt-2 text-sm text-[#6b7280]">{selectedTopic.description}</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEditTopic(selectedTopic)} aria-label={`Edit ${selectedTopic.name}`} className="rounded-lg border border-[#e5e7eb] p-2 text-[#6b7280] hover:bg-[#f9fafb]">
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => setTopicToDelete(selectedTopic)} aria-label={`Delete ${selectedTopic.name}`} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {selectedTopic.link && (
            <div className="mb-4">
              <a href={selectedTopic.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm font-semibold text-emerald-700 hover:underline">
                {selectedTopic.link} <ExternalLink size={14} className="shrink-0" />
              </a>
            </div>
          )}

          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsInternalTopicFormOpen((isOpen) => !isOpen)}
              aria-expanded={isInternalTopicFormOpen}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-4 py-2.5 text-sm font-bold text-white"
            >
              <FolderPlus size={17} />
              {isInternalTopicFormOpen ? 'Cancel' : 'Add Internal Topic'}
            </button>
          </div>
          {isInternalTopicFormOpen && (
            <form onSubmit={handleAddInternalTopic} className="mb-6 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
              <h3 className="font-bold">Add an internal topic to {selectedTopic.name}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  name="name"
                  value={internalTopic.name}
                  onChange={updateInternalTopic}
                  maxLength={120}
                  required
                  placeholder="Internal topic name (ML, DL...)"
                  className="rounded-lg border border-[#d1d5db] px-3 py-2.5 outline-none focus:border-[#1f2937]"
                />
                <input
                  type="url"
                  name="link"
                  value={internalTopic.link}
                  onChange={updateInternalTopic}
                  maxLength={2048}
                  placeholder="Link (optional): https://..."
                  className="rounded-lg border border-[#d1d5db] px-3 py-2.5 outline-none focus:border-[#1f2937]"
                />
                <textarea
                  name="description"
                  value={internalTopic.description}
                  onChange={updateInternalTopic}
                  maxLength={500}
                  rows={2}
                  placeholder="Description"
                  className="resize-none rounded-lg border border-[#d1d5db] px-3 py-2.5 outline-none focus:border-[#1f2937] md:col-span-2"
                />
              </div>
              <button type="submit" disabled={isSavingInternalTopic} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Plus size={17} />
                {isSavingInternalTopic ? 'Adding...' : 'Add Internal Topic'}
              </button>
            </form>
          )}

          {selectedInternalTopics.length > 0 ? (
            <ul className="space-y-3">
              {selectedInternalTopics.map((item) => renderTopicDropdown(item))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-[#d1d5db] px-5 py-10 text-center text-sm text-[#6b7280]">
              No topics added to this subject yet.
            </p>
          )}
        </section>
      ) : (
        <section aria-label="Topic list" className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Topic list</h2>
            <span className="text-sm text-[#6b7280]">{parentTopics.length}</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-[#6b7280]">Loading topics...</p>
          ) : parentTopics.length > 0 ? (
            <ul className="divide-y divide-[#e5e7eb]">
              {parentTopics.map((item) => {
                const childCount = topics.filter((child) => child.parentId === item.id).length;
                return (
                  <li key={item.id} className="py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTopicId(item.id);
                          setIsInternalTopicFormOpen(false);
                          setIsSubjectLinkOpen(false);
                          setAddingSubtopicToId('');
                          setSubtopic(emptySubtopic);
                          setInternalTopic(emptyInternalTopic);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#f9fafb]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#4b5563]">
                          <FolderPlus size={19} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{item.name}</span>
                          <span className="mt-0.5 block text-xs text-[#6b7280]">
                            {childCount} internal topic{childCount === 1 ? '' : 's'}
                          </span>
                        </span>
                        <ChevronRight size={18} className="shrink-0 text-[#6b7280]" />
                      </button>
                      <button type="button" onClick={() => startEditTopic(item)} aria-label={`Edit ${item.name}`} className="rounded-lg border border-[#e5e7eb] p-2 text-[#6b7280] hover:bg-[#f9fafb]">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-[#d1d5db] px-5 py-10 text-center text-sm text-[#6b7280]">
              No topics have been added yet.
            </p>
          )}
        </section>
      )}

      {topicToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete topic?</h2>
            <p className="mt-2 text-sm text-[#6b7280]">
              {topicToDelete.parentId
                ? topics.find((item) => item.id === topicToDelete.parentId)?.parentId
                  ? <>Remove subtopic <strong>{topicToDelete.name}</strong>?</>
                  : <>Remove internal topic <strong>{topicToDelete.name}</strong> and all its subtopics?</>
                : <>Remove subject <strong>{topicToDelete.name}</strong> and all its internal topics and subtopics?</>}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setTopicToDelete(null)} disabled={isDeleting} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleEditTopic} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">
              Edit {editingTopic.parentId
                ? topics.find((item) => item.id === editingTopic.parentId)?.parentId ? 'Subtopic' : 'Internal Topic'
                : 'Topic'}
            </h2>
            <label className="block text-sm font-semibold text-[#374151]">
              Topic Name
              <input
                name="name"
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                maxLength={120}
                required
                className="mt-2 w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 font-normal outline-none focus:border-[#1f2937]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#374151]">
              Link (optional)
              <input
                type="url"
                name="link"
                value={editForm.link}
                onChange={(event) => setEditForm((current) => ({ ...current, link: event.target.value }))}
                maxLength={2048}
                className="mt-2 w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 font-normal outline-none focus:border-[#1f2937]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#374151]">
              Description
              <textarea
                name="description"
                value={editForm.description}
                onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={500}
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-[#d1d5db] px-3 py-2.5 font-normal outline-none focus:border-[#1f2937]"
              />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditingTopic(null)} disabled={isUpdatingTopic} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={isUpdatingTopic} className="rounded-lg bg-[#1f2937] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {isUpdatingTopic ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
