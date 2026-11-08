import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getVehicleInitials } from '../lib/vehicles';
import type { Vehicle } from '../lib/types';
import { CarIcon, CheckIcon, ChevronIcon, CloseIcon, TrashIcon } from './icons';

interface VehicleGarageProps {
  vehicles: Vehicle[];
  activeVehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
  onAdd: (name: string, plate: string) => void;
  onRemove: (vehicleId: string) => void;
  recordingVehicleId?: string | null;
  recordingVehicleName?: string | null;
}

export function VehicleGarage({
  vehicles,
  activeVehicle,
  onSelect,
  onAdd,
  onRemove,
  recordingVehicleId,
  recordingVehicleName,
}: VehicleGarageProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 40);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Give the vehicle a name first.');
      return;
    }

    onAdd(name, plate);
    setName('');
    setPlate('');
    setError(null);
    close();
  };

  const handleRemove = (vehicle: Vehicle) => {
    if (recordingVehicleId === vehicle.id) return;

    const confirmed = window.confirm(
      `Remove ${vehicle.name} from your garage?\n\nIts trips stay in your log.`,
    );
    if (confirmed) onRemove(vehicle.id);
  };

  return (
    <>
      <section className="garage-strip" aria-label="Vehicle garage">
        <span className="garage-label">
          <CarIcon size={15} />
          <span>Vehicle</span>
        </span>

        <div className="vehicle-chips" role="group" aria-label="Choose the active vehicle">
          {vehicles.map((vehicle) => {
            const active = vehicle.id === activeVehicle.id;
            return (
              <button
                key={vehicle.id}
                type="button"
                className={`vehicle-chip ${active ? 'active' : ''}`}
                aria-pressed={active}
                title={vehicle.plate ? `${vehicle.name} · ${vehicle.plate}` : vehicle.name}
                onClick={() => onSelect(vehicle.id)}
              >
                <span className="chip-dot" aria-hidden="true" />
                <span>{vehicle.name}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="garage-manage" onClick={() => setOpen(true)}>
          Garage
          <ChevronIcon size={13} />
        </button>
      </section>

      {open && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            className="garage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="garage-title"
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">Your library</span>
                <h2 id="garage-title">Vehicle garage</h2>
                <p>New drives record to the selected vehicle.</p>
              </div>
              <button type="button" className="icon-button" aria-label="Close garage" onClick={close}>
                <CloseIcon size={16} />
              </button>
            </div>

            {recordingVehicleName && (
              <p className="garage-recording">
                <CarIcon size={14} />
                Current drive is recording to <strong>{recordingVehicleName}</strong>. A new
                selection applies to the next drive.
              </p>
            )}

            <ul className="garage-list">
              {vehicles.map((vehicle) => {
                const active = vehicle.id === activeVehicle.id;
                const recording = recordingVehicleId === vehicle.id;
                return (
                  <li className="garage-option-row" key={vehicle.id}>
                    <button
                      type="button"
                      className={`garage-option ${active ? 'active' : ''}`}
                      aria-pressed={active}
                      onClick={() => {
                        onSelect(vehicle.id);
                        close();
                      }}
                    >
                      <span className="vehicle-avatar" aria-hidden="true">
                        {getVehicleInitials(vehicle.name)}
                      </span>
                      <span className="garage-option-copy">
                        <strong>{vehicle.name}</strong>
                        <span>{vehicle.plate ?? 'No plate saved'}</span>
                      </span>
                      {active && (
                        <span className="garage-check" aria-label="Active vehicle">
                          <CheckIcon size={16} />
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="garage-remove"
                      aria-label={`Remove ${vehicle.name} from garage`}
                      title={
                        recording ? 'Stop the current drive before removing this vehicle.' : undefined
                      }
                      disabled={recording}
                      onClick={() => handleRemove(vehicle)}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <form className="garage-form" onSubmit={handleAdd}>
              <h3>Add another vehicle</h3>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Vehicle name</span>
                  <input
                    ref={nameInputRef}
                    className="text-input"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Work van"
                    maxLength={40}
                    autoComplete="off"
                  />
                </label>
                <label className="field">
                  <span className="field-label">
                    Plate <em>Optional</em>
                  </span>
                  <input
                    className="text-input"
                    type="text"
                    value={plate}
                    onChange={(event) => setPlate(event.target.value)}
                    placeholder="XYZ 789"
                    maxLength={12}
                    autoComplete="off"
                  />
                </label>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="primary-button" disabled={!name.trim()}>
                <CarIcon size={16} />
                Add vehicle
              </button>
            </form>

            <p className="modal-note">
              Each trip keeps the vehicle it started with, even after you remove it. All vehicles
              and mileage stay on this device.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
