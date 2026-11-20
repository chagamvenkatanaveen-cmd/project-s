'use client';

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import {
  AVATAR_GLASSES_DESIGNS,
  AVATAR_HAIR_STYLES,
  AVATAR_SCARF_DESIGNS,
  AVATAR_SHIRT_DESIGNS,
  AVATAR_SKIN_TONES,
  DEFAULT_AVATAR_CONFIG,
  normalizeAvatarConfig,
} from '@/lib/avatarConfig';

const avatarDesignGroups = [
  { key: 'hair', label: 'Hair style', options: AVATAR_HAIR_STYLES },
  { key: 'skinTone', label: 'Skin tone', options: AVATAR_SKIN_TONES },
  { key: 'shirt', label: 'Shirt design', options: AVATAR_SHIRT_DESIGNS },
  { key: 'glasses', label: 'Spectacles', options: AVATAR_GLASSES_DESIGNS, optional: true },
  { key: 'scarf', label: 'Scarf', options: AVATAR_SCARF_DESIGNS, optional: true },
];

export default function AvatarEditor({
  avatarKey = 'male',
  avatarConfig = DEFAULT_AVATAR_CONFIG,
  onAvatarKeyChange,
  onAvatarConfigChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftAvatarKey, setDraftAvatarKey] = useState(avatarKey);
  const [draftAvatarConfig, setDraftAvatarConfig] = useState(avatarConfig);
  const selectedConfig = normalizeAvatarConfig(draftAvatarConfig);

  function chooseDesign(key, value) {
    setDraftAvatarConfig({ ...selectedConfig, [key]: value });
  }

  function openEditor() {
    setDraftAvatarKey(avatarKey);
    setDraftAvatarConfig(avatarConfig);
    setIsOpen(true);
  }

  function saveAvatar() {
    onAvatarKeyChange(draftAvatarKey);
    onAvatarConfigChange(selectedConfig);
    setIsOpen(false);
  }

  return (
    <section className="sm:col-span-2" aria-label="Profile avatar">
      <div className="flex items-center gap-4 rounded-xl border border-[#e5e7eb] p-4">
        <ProfileAvatar avatarKey={avatarKey} avatarConfig={avatarConfig} size={72} />
        <div>
          <p className="text-sm font-semibold text-[#1f2937]">Your avatar</p>
          <button
            type="button"
            onClick={openEditor}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#1f2937] hover:bg-[#f9fafb]"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit avatar
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-editor-title"
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="avatar-editor-title" className="text-xl font-bold text-[#111827]">
                  Edit your avatar
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Choose a style for each feature. Spectacles and scarf are optional.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close avatar editor"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <fieldset>
              <legend className="mb-3 block text-sm font-semibold">Avatar style</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'male', label: 'Male avatar' },
                  { value: 'female', label: 'Female avatar' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-colors ${
                      draftAvatarKey === value
                        ? 'border-[#1f2937] bg-[#f9fafb] ring-1 ring-[#1f2937]'
                        : 'border-[#e5e7eb] hover:border-[#9ca3af]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="avatarKey"
                      value={value}
                      checked={draftAvatarKey === value}
                      onChange={() => setDraftAvatarKey(value)}
                      className="sr-only"
                    />
                    <ProfileAvatar avatarKey={value} avatarConfig={selectedConfig} size={56} />
                    <span className="text-sm font-semibold text-[#1f2937]">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 space-y-6">
              {avatarDesignGroups.map(({ key, label, options, optional }) => (
                <fieldset key={key}>
                  <legend className="mb-3 block text-sm font-semibold">{label}</legend>
                  {optional && (
                    <button
                      type="button"
                      aria-pressed={selectedConfig[key] === null}
                      onClick={() => chooseDesign(key, null)}
                      className={`mb-3 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedConfig[key] === null
                          ? 'border-[#1f2937] bg-[#f9fafb] ring-1 ring-[#1f2937]'
                          : 'border-[#e5e7eb] hover:border-[#9ca3af]'
                      }`}
                    >
                      No {label.toLowerCase()}
                    </button>
                  )}
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {options.map((option, index) => {
                      const isSelected = selectedConfig[key] === index;
                      const optionName = typeof option === 'string' ? option : option.name;

                      return (
                        <button
                          key={optionName}
                          type="button"
                          aria-label={`${label}: ${optionName}`}
                          aria-pressed={isSelected}
                          onClick={() => chooseDesign(key, index)}
                          className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border p-1.5 text-center text-[11px] font-medium transition-colors ${
                            isSelected
                              ? 'border-[#1f2937] bg-[#f9fafb] ring-1 ring-[#1f2937]'
                              : 'border-[#e5e7eb] hover:border-[#9ca3af]'
                          }`}
                        >
                          <ProfileAvatar
                            avatarKey={draftAvatarKey}
                            avatarConfig={{ ...selectedConfig, [key]: index }}
                            size={40}
                          />
                          <span className="w-full truncate">{optionName}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-7 flex justify-end gap-3 border-t border-[#e5e7eb] pt-5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAvatar}
                className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white hover:bg-[#374151]"
              >
                Save avatar
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
