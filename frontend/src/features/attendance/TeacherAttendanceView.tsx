import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.provider';
import { showErrorToast, showSuccessToast } from '../../utils/notifications';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Fingerprint, KeyRound, MapPin, CheckCircle } from 'lucide-react';

import { TeacherAttendanceStatus } from '../../types';

// WebAuthn helper functions (adapted from your webauthn_client.js)
const bufferDecode = (value: string): ArrayBuffer => {
  const s = value.replace(/_/g, '/').replace(/-/g, '+');
  const decoded = atob(s);
  const buffer = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    buffer[i] = decoded.charCodeAt(i);
  }
  return buffer.buffer;
};
const bufferEncode = (value: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const TeacherAttendanceView: React.FC = () => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState('');

    // Query to get the current attendance status
    const { data: status, isLoading: isStatusLoading } = useQuery({
        queryKey: ['teacherAttendanceStatus'],
        queryFn: apiService.getTeacherAttendanceStatus,
    });

    const handleRegisterDevice = async () => {
        if (!navigator.credentials) {
            showErrorToast("WebAuthn is not supported by this browser or in the current context. Please use HTTPS or localhost.");
            return;
        }
        setIsLoading(true);
        try {
            const options = await apiService.getWebAuthnRegistrationOptions();
            
            // Convert challenge and user.id from Base64URL to ArrayBuffer
            options.challenge = bufferDecode(options.challenge);
            options.user.id = bufferDecode(options.user.id);

            const cred = await navigator.credentials.create({ publicKey: options });

            if (cred) {
                const credentialForServer = {
                    id: cred.id,
                    rawId: bufferEncode(cred.rawId!),
                    type: cred.type,
                    response: {
                        clientDataJSON: bufferEncode(cred.response.clientDataJSON),
                        attestationObject: bufferEncode((cred.response as AuthenticatorAttestationResponse).attestationObject),
                    },
                };
                await apiService.verifyWebAuthnRegistration(credentialForServer);
                showSuccessToast('Device registered successfully!');
                queryClient.invalidateQueries({ queryKey: ['teacherAttendanceStatus'] });
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                showErrorToast(err.message || 'Registration failed.');
            } else {
                showErrorToast('An unknown error occurred during registration.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!navigator.credentials) {
            showErrorToast("WebAuthn is not supported by this browser or in the current context. Please use HTTPS or localhost.");
            return;
        }
        setIsLoading(true);
        try {
            const location = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), err => reject(err));
            });

            const options = await apiService.getWebAuthnAuthOptions();
            options.challenge = bufferDecode(options.challenge);
            options.allowCredentials?.forEach((c: PublicKeyCredentialDescriptor) => c.id = bufferDecode(c.id as unknown as string));

            const assertion = await navigator.credentials.get({ publicKey: options });
            
            if (assertion && assertion instanceof PublicKeyCredential) {
                const response = assertion.response as AuthenticatorAssertionResponse;
                const assertionForServer = {
                    id: assertion.id,
                    rawId: bufferEncode(assertion.rawId!),
                    type: assertion.type,
                    response: {
                        authenticatorData: bufferEncode(response.authenticatorData),
                        clientDataJSON: bufferEncode(response.clientDataJSON),
                        signature: bufferEncode(response.signature),
                        userHandle: response.userHandle ? bufferEncode(response.userHandle) : '',
                    },
                };

                await apiService.verifyTeacherCheckIn({
                    credential: assertionForServer,
                    location: { latitude: location.latitude, longitude: location.longitude }
                });

                showSuccessToast('Checked in successfully!');
                queryClient.invalidateQueries({ queryKey: ['teacherAttendanceStatus'] });
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                showErrorToast(err.message || 'Check-in failed. Ensure location is enabled.');
            } else {
                showErrorToast('An unknown error occurred during check-in.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!navigator.credentials) {
            showErrorToast("WebAuthn is not supported by this browser or in the current context. Please use HTTPS or localhost.");
            return;
        }
        setIsLoading(true);
        try {
            const location = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), err => reject(err));
            });

            const options = await apiService.getWebAuthnAuthOptions();
            options.challenge = bufferDecode(options.challenge);
            options.allowCredentials?.forEach((c: PublicKeyCredentialDescriptor) => c.id = bufferDecode(c.id as unknown as string));

            const assertion = await navigator.credentials.get({ publicKey: options });
            
            if (assertion && assertion instanceof PublicKeyCredential) {
                const response = assertion.response as AuthenticatorAssertionResponse;
                const assertionForServer = {
                    id: assertion.id,
                    rawId: bufferEncode(assertion.rawId!),
                    type: assertion.type,
                    response: {
                        authenticatorData: bufferEncode(response.authenticatorData),
                        clientDataJSON: bufferEncode(response.clientDataJSON),
                        signature: bufferEncode(response.signature),
                        userHandle: response.userHandle ? bufferEncode(response.userHandle) : '',
                    },
                };

                const result = await apiService.verifyTeacherCheckOut({
                    credential: assertionForServer,
                    location: { latitude: location.latitude, longitude: location.longitude }
                });

                showSuccessToast('Checked out successfully!');

                // Optimistically update the UI
                queryClient.setQueryData(['teacherAttendanceStatus'], (oldData: TeacherAttendanceStatus | undefined) => {
                    if (oldData) {
                        return {
                            ...oldData,
                            status: 'Checked Out',
                            check_out_time: result.check_out_time,
                        };
                    }
                    return oldData;
                });
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                showErrorToast(err.message || 'Check-out failed. Ensure location is enabled.');
            } else {
                showErrorToast('An unknown error occurred during check-out.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecoveryCheckIn = async () => {
        if (!recoveryCode) {
            showErrorToast('Please enter a recovery code.');
            return;
        }
        setIsLoading(true);
        try {
            const location = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), err => reject(err));
            });
            await apiService.checkInWithRecoveryCode({
                code: recoveryCode,
                location: { latitude: location.latitude, longitude: location.longitude }
            });
            showSuccessToast('Checked in successfully with recovery code!');
            queryClient.invalidateQueries({ queryKey: ['teacherAttendanceStatus'] });
        } catch (err: unknown) {
            if (err instanceof Error) {
                showErrorToast(err.message || 'Recovery code check-in failed.');
            } else {
                showErrorToast('An unknown error occurred during recovery check-in.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isStatusLoading) {
        return <LoadingSpinner text="Checking attendance status..."/>;
    }

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Teacher Attendance</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-2">Today's Status</h2>
                <p className="text-gray-600">Status: <span className="font-bold text-blue-600">{status?.status || 'Not Checked In'}</span></p>
                {status?.check_in_time && <p>Checked In: {new Date(status.check_in_time).toLocaleTimeString()}</p>}
                {status?.check_out_time && <p>Checked Out: {new Date(status.check_out_time).toLocaleTimeString()}</p>}
            </div>

            {/* Main Action Buttons */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4">Actions</h2>

                {/* Not registered */}
                {!status?.is_device_registered && (
                    <button onClick={handleRegisterDevice} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                        <Fingerprint /> {isLoading ? 'Registering...' : 'Register This Device'}
                    </button>
                )}

                {/* Registered but not checked in */}
                {status?.is_device_registered && !status?.check_in_time && (
                    <button onClick={handleCheckIn} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                        <MapPin /> {isLoading ? 'Checking In...' : 'Check In'}
                    </button>
                )}

                {/* Checked in but not checked out */}
                {status?.is_device_registered && status?.check_in_time && !status?.check_out_time && (
                    <button onClick={handleCheckOut} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                        <MapPin /> {isLoading ? 'Checking Out...' : 'Check Out'}
                    </button>
                )}

                {/* Checked in and checked out */}
                {status?.check_in_time && status?.check_out_time && (
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                        <h3 className="mt-2 text-base font-semibold text-green-800">Attendance Complete</h3>
                        <p className="mt-1 text-sm text-green-700">
                            You have successfully checked in and out for the day.
                        </p>
                    </div>
                )}
            </div>
            
            {/* Fallback Section */}
            {!status?.check_in_time && (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <h2 className="text-lg font-semibold mb-4 text-yellow-800">Device Unavailable?</h2>
                    <p className="text-sm text-yellow-700 mb-4">If you cannot use your registered device, use a one-time recovery code provided by the admin.</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={recoveryCode}
                            onChange={(e) => setRecoveryCode(e.target.value)}
                            placeholder="Enter recovery code"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        <button onClick={handleRecoveryCheckIn} disabled={isLoading} className="flex items-center justify-center gap-2 bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400">
                           <KeyRound /> Submit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAttendanceView;