'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';

interface PharmacyOption {
  _id: string;
  name: string;
}

interface LinkedPharmacist {
  userId:
    | { _id: string; name?: string; email?: string; role?: string }
    | string;
  name: string;
  licenseNumber: string;
}

interface PharmacyWithPharmacists {
  _id: string;
  name: string;
  pharmacists: LinkedPharmacist[];
}

export default function PharmacistLinkingPage() {
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [pharmacistEmail, setPharmacistEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [linkedData, setLinkedData] = useState<PharmacyWithPharmacists | null>(
    null
  );
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load pharmacies for the dropdown
  useEffect(() => {
    async function loadPharmacies() {
      try {
        const res = await fetch('/api/admin/pharmacies');
        const json = await res.json();
        if (json.success) {
          setPharmacies(json.data);
        } else {
          setFeedback({
            type: 'error',
            message: json.error || 'Failed to load pharmacies',
          });
        }
      } catch {
        setFeedback({
          type: 'error',
          message: 'Could not reach the server to load pharmacies',
        });
      } finally {
        setLoadingPharmacies(false);
      }
    }
    loadPharmacies();
  }, []);

  // Load the currently-linked pharmacists whenever the selected pharmacy changes
  const loadLinked = useCallback(async (pharmacyId: string) => {
    if (!pharmacyId) {
      setLinkedData(null);
      return;
    }
    setLoadingLinked(true);
    try {
      const res = await fetch(
        `/api/admin/link-pharmacist-to-pharmacy?pharmacyId=${pharmacyId}`
      );
      const json = await res.json();
      if (json.success) {
        setLinkedData(json.data);
      } else {
        setLinkedData(null);
        setFeedback({
          type: 'error',
          message: json.error || 'Failed to load linked pharmacists',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Could not reach the server to load linked pharmacists',
      });
    } finally {
      setLoadingLinked(false);
    }
  }, []);

  useEffect(() => {
    loadLinked(selectedPharmacyId);
  }, [selectedPharmacyId, loadLinked]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!selectedPharmacyId || !pharmacistEmail || !licenseNumber) {
      setFeedback({
        type: 'error',
        message:
          'Fill in the pharmacy, email, and license number before linking.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/link-pharmacist-to-pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacistEmail,
          pharmacyId: selectedPharmacyId,
          licenseNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: 'success',
          message: json.message || 'Pharmacist linked successfully',
        });
        setPharmacistEmail('');
        setLicenseNumber('');
        loadLinked(selectedPharmacyId);
      } else {
        setFeedback({
          type: 'error',
          message: json.error || 'Failed to link pharmacist',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Could not reach the server' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlink(pharmacistUserId: string) {
    if (!selectedPharmacyId) return;
    setUnlinkingId(pharmacistUserId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/link-pharmacist-to-pharmacy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: selectedPharmacyId,
          pharmacistUserId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: 'Pharmacist unlinked' });
        loadLinked(selectedPharmacyId);
      } else {
        setFeedback({
          type: 'error',
          message: json.error || 'Failed to unlink pharmacist',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Could not reach the server' });
    } finally {
      setUnlinkingId(null);
    }
  }

  const selectedPharmacyName = pharmacies.find(
    p => p._id === selectedPharmacyId
  )?.name;

  return (
    <div className='min-h-screen bg-[#F6F7F5] px-4 py-10 sm:py-14'>
      <div className='mx-auto max-w-2xl'>
        {/* Header */}
        <div className='mb-8'>
          <span className='inline-block rounded-full bg-[#136659]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#136659]'>
            Admin
          </span>
          <h1 className='mt-3 text-2xl font-semibold tracking-tight text-[#16231F] sm:text-3xl'>
            Link pharmacists to pharmacies
          </h1>
          <p className='mt-2 text-sm text-[#5B6660]'>
            Connect a pharmacist&apos;s account to a pharmacy so they can see
            and act on prescriptions sent there.
          </p>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            role='status'
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-[#1E7A45]/20 bg-[#EAF6EE] text-[#1E7A45]'
                : 'border-[#B23B3B]/20 bg-[#FBEAEA] text-[#B23B3B]'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Link form card */}
        <form
          onSubmit={handleSubmit}
          className='rounded-2xl border border-[#E1E4E0] bg-white p-6 shadow-sm sm:p-8'
        >
          <h2 className='text-sm font-semibold uppercase tracking-wide text-[#5B6660]'>
            New link
          </h2>

          <div className='mt-4 grid gap-4'>
            <div>
              <label
                htmlFor='pharmacy'
                className='mb-1.5 block text-sm font-medium text-[#16231F]'
              >
                Pharmacy
              </label>
              <select
                id='pharmacy'
                value={selectedPharmacyId}
                onChange={e => setSelectedPharmacyId(e.target.value)}
                disabled={loadingPharmacies}
                className='w-full rounded-lg border border-[#E1E4E0] bg-white px-3 py-2.5 text-sm text-[#16231F] outline-none transition focus:border-[#136659] focus:ring-2 focus:ring-[#136659]/20 disabled:opacity-50'
              >
                <option value=''>
                  {loadingPharmacies
                    ? 'Loading pharmacies…'
                    : 'Select a pharmacy'}
                </option>
                {pharmacies.map(pharmacy => (
                  <option key={pharmacy._id} value={pharmacy._id}>
                    {pharmacy.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor='email'
                className='mb-1.5 block text-sm font-medium text-[#16231F]'
              >
                Pharmacist email
              </label>
              <input
                id='email'
                type='email'
                value={pharmacistEmail}
                onChange={e => setPharmacistEmail(e.target.value)}
                placeholder='pharmacist@example.com'
                className='w-full rounded-lg border border-[#E1E4E0] bg-white px-3 py-2.5 text-sm text-[#16231F] outline-none transition placeholder:text-[#9CA39E] focus:border-[#136659] focus:ring-2 focus:ring-[#136659]/20'
              />
              <p className='mt-1.5 text-xs text-[#8A938C]'>
                Must match an existing account with the pharmacist role.
              </p>
            </div>

            <div>
              <label
                htmlFor='license'
                className='mb-1.5 block text-sm font-medium text-[#16231F]'
              >
                License number
              </label>
              <input
                id='license'
                type='text'
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value.toUpperCase())}
                placeholder='LIC-0001'
                className='w-full rounded-lg border border-[#E1E4E0] bg-white px-3 py-2.5 font-mono text-sm tracking-wide text-[#16231F] outline-none transition placeholder:font-sans placeholder:text-[#9CA39E] focus:border-[#136659] focus:ring-2 focus:ring-[#136659]/20'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={submitting}
            className='mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#136659] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F5048] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
          >
            {submitting ? 'Linking…' : 'Link pharmacist'}
          </button>
        </form>

        {/* Linked pharmacists card */}
        {selectedPharmacyId && (
          <div className='mt-6 rounded-2xl border border-[#E1E4E0] bg-white p-6 shadow-sm sm:p-8'>
            <h2 className='text-sm font-semibold uppercase tracking-wide text-[#5B6660]'>
              Linked to {selectedPharmacyName || 'this pharmacy'}
            </h2>

            <div className='mt-4'>
              {loadingLinked ? (
                <p className='py-6 text-center text-sm text-[#8A938C]'>
                  Loading…
                </p>
              ) : !linkedData || linkedData.pharmacists.length === 0 ? (
                <p className='py-6 text-center text-sm text-[#8A938C]'>
                  No pharmacists are linked to this pharmacy yet.
                </p>
              ) : (
                <ul className='divide-y divide-[#E1E4E0]'>
                  {linkedData.pharmacists.map(p => {
                    const id =
                      typeof p.userId === 'string' ? p.userId : p.userId._id;
                    const email =
                      typeof p.userId === 'object' ? p.userId.email : undefined;
                    return (
                      <li
                        key={id}
                        className='flex items-center justify-between gap-4 py-3'
                      >
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-medium text-[#16231F]'>
                            {p.name}
                          </p>
                          {email && (
                            <p className='truncate text-xs text-[#8A938C]'>
                              {email}
                            </p>
                          )}
                        </div>

                        <div className='flex items-center gap-3'>
                          <span className='rounded-md bg-[#EFEBE2] px-2.5 py-1 font-mono text-xs tracking-wide text-[#6B5B3E]'>
                            {p.licenseNumber}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleUnlink(id)}
                            disabled={unlinkingId === id}
                            className='text-xs font-medium text-[#B23B3B] underline-offset-2 hover:underline disabled:opacity-50'
                          >
                            {unlinkingId === id ? 'Removing…' : 'Unlink'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
