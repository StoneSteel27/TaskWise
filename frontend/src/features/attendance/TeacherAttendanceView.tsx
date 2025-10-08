import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.provider';
import { showErrorToast, showSuccessToast } from '../../utils/notifications';
import LoadingSpinner from '../../components/LoadingSpinner';
import Fingerprint from 'lucide-react/dist/esm/icons/fingerprint';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Crosshair from 'lucide-react/dist/esm/icons/crosshair';

import { TeacherAttendanceStatus, WebAuthnRegistrationRequest, GeoFence } from '../../types';
import MapView from './MapView';

// WebAuthn helper functions
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

type WebAuthnCredential = {
    id: string;
    rawId: string;
    type: string;
    response: {
        authenticatorData: string;
        clientDataJSON: string;
        signature: string;
        userHandle: string;
    };
};

const TeacherAttendanceView: React.FC = () => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState('');
    const [view, setView] = useState('actions'); // 'actions' or 'history'
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [registrationRecoveryCode, setRegistrationRecoveryCode] = useState('');
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [recoveryReason, setRecoveryReason] = useState('');
    const [recoveryAction, setRecoveryAction] = useState<'checkin' | 'checkout'>('checkin');

    const [teacherLocation, setTeacherLocation] = useState<GeolocationCoordinates | null>(null);
    const [geoFences, setGeoFences] = useState<GeoFence[]>([]);
    const [selectedGeoFence, setSelectedGeoFence] = useState<GeoFence | null>(null);
    const [focusOn, setFocusOn] = useState<'user' | 'fence' | 'both'>('both');

    const { data: status, isLoading: isStatusLoading } = useQuery({
        queryKey: ['teacherAttendanceStatus'],
        queryFn: apiService.getTeacherAttendanceStatus,
    });

    useEffect(() => {
      // Fetch geofence data
      const fetchGeoFences = async () => {
        try {
          const fences = await apiService.getGeoFence();
          if (fences && fences.length > 0) {
            setGeoFences(fences);
            setSelectedGeoFence(fences[0]);
            setFocusOn('fence');
          } else {
            console.error('No geofences returned from API.');
          }
        } catch (error) {
          console.error("Error fetching geofence data:", error);
        }
      };

      fetchGeoFences();
    }, []);

    const handleFocusClick = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setTeacherLocation(position.coords);
            setFocusOn('user');
          },
          (error) => {
            console.error("Error getting user location:", error);
            showErrorToast("Could not get your location. Please ensure location services are enabled.");
          }
        );
      } else {
        showErrorToast("Geolocation is not supported by this browser.");
      }
    };

    const handleFenceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = parseInt(event.target.value, 10);
      const fence = geoFences.find(f => f.id === selectedId);
      if (fence) {
        setSelectedGeoFence(fence);
        setFocusOn('fence');
      }
    };

    // Code for history view
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['teacherSelfAttendanceHistory', year, month],
        queryFn: () => apiService.getTeacherAttendanceHistory(year, month),
        enabled: view === 'history', // Only fetch when history view is active
    });

    const attendanceMap = React.useMemo(() => {
        const map = new Map<string, { check_in_time: string | null, check_out_time: string | null }>();
        historyData?.history.forEach(record => {
            map.set(new Date(record.date).toDateString(), {
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
            });
        });
        return map;
    }, [historyData]);

    const handleRegisterDevice = async () => {
        if (!navigator.credentials) {
            showErrorToast("WebAuthn is not supported by this browser or in the current context. Please use HTTPS or localhost.");
            return;
        }
        setIsRegisterModalOpen(true);
    };

    const handleRegistrationSubmit = async () => {
        if (!deviceName || !registrationRecoveryCode) {
            showErrorToast("Please enter a device name and recovery code.");
            return;
        }
        setIsLoading(true);
        setIsRegisterModalOpen(false);
        try {
            const options = await apiService.getWebAuthnRegistrationOptions();
            
            options.challenge = bufferDecode(options.challenge as unknown as string);
            options.user.id = bufferDecode(options.user.id as unknown as string);

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
                    device_name: deviceName,
                    recovery_code: registrationRecoveryCode,
                };
                await apiService.verifyWebAuthnRegistration(credentialForServer as WebAuthnRegistrationRequest);
                showSuccessToast('Device registered successfully!');
                queryClient.invalidateQueries({ queryKey: ['teacherAttendanceStatus'] });
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                showErrorToast(err.message || 'Registration failed.');
            }
            else {
                showErrorToast('An unknown error occurred during registration.');
            }
        }
        finally {
            setIsLoading(false);
            setDeviceName('');
            setRegistrationRecoveryCode('');
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
            options.challenge = bufferDecode(options.challenge as unknown as string);
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
                    credential: assertionForServer as WebAuthnCredential,
                    location: { latitude: location.latitude, longitude: location.longitude }
                });

                showSuccessToast('Checked in successfully!');
                queryClient.invalidateQueries({ queryKey: ['teacherAttendanceStatus'] });
            }
        }
        catch (err: unknown) {
            if (err instanceof Error) {
                showErrorToast(err.message || 'Check-in failed. Ensure location is enabled.');
            }
            else {
                showErrorToast('An unknown error occurred during check-in.');
            }
        }
        finally {
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
            options.challenge = bufferDecode(options.challenge as unknown as string);
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
                    credential: assertionForServer as WebAuthnCredential,
                    location: { latitude: location.latitude, longitude: location.longitude }
                });

                showSuccessToast('Checked out successfully!');

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
        }
        catch (err: unknown) {
            if (err instanceof Error) {
                showErrorToast(err.message || 'Check-out failed. Ensure location is enabled.');
            }
            else {
                showErrorToast('An unknown error occurred during check-out.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleRecoveryCheckIn = async () => {
        if (!recoveryCode) {
            showErrorToast('Please enter a recovery code.');
            return;
        }
        setRecoveryAction('checkin');
        setIsRecoveryModalOpen(true);
    };

    const handleRecoveryCheckOut = async () => {
        if (!recoveryCode) {
            showErrorToast('Please enter a recovery code.');
            return;
        }
        setRecoveryAction('checkout');
        setIsRecoveryModalOpen(true);
    };

    const handleRecoverySubmit = async () => {
        if (!recoveryReason) {
            showErrorToast('Please enter a reason for using the recovery code.');
            return;
        }
        setIsLoading(true);
        setIsRecoveryModalOpen(false);
        try {
            const location = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), err => reject(err));
            });

            const payload = {
                code: recoveryCode,
                location: { latitude: location.latitude, longitude: location.longitude },
                reason: recoveryReason,
            };

            if (recoveryAction === 'checkin') {
                await apiService.checkInWithRecoveryCode(payload);
                showSuccessToast('Checked in successfully with recovery code!');
            }
            else {
                await apiService.checkOutWithRecoveryCode(payload);
                showSuccessToast('Checked out successfully with recovery code!');
            }

            queryClient.invalidateQueries({ queryKey: ['teacherAttendanceStatus'] });
        }
        catch (err: unknown) {
            if (err instanceof Error) {
                const errorMessage = recoveryAction === 'checkin' 
                    ? 'Recovery code check-in failed.'
                    : 'Recovery code check-out failed.';
                showErrorToast(err.message || errorMessage);
            }
            else {
                const errorMessage = recoveryAction === 'checkin' 
                    ? 'An unknown error occurred during recovery check-in.' 
                    : 'An unknown error occurred during recovery check-out.';
                showErrorToast(errorMessage);
            }
        }
        finally {
            setIsLoading(false);
            setRecoveryCode('');
            setRecoveryReason('');
        }
    };

    const renderHistoryView = () => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

        const getStatusInfo = (status: { check_in_time: string | null, check_out_time: string | null } | undefined) => {
            if (!status || (!status.check_in_time && !status.check_out_time)) {
                return { color: 'bg-gray-100 text-gray-800', icon: null, label: 'No Record' };
            }
            if (status.check_in_time && status.check_out_time) {
                return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-5 h-5 text-green-500" />, label: 'Present' };
            }
            if (status.check_in_time) {
                return { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-5 h-5 text-yellow-500" />, label: 'Checked In' };
            }
            return { color: 'bg-gray-100 text-gray-800', icon: null, label: 'No Record' };
        };

        const renderCalendar = () => {
            const days = [];
            for (let i = 0; i < firstDayOfMonth; i++) {
                days.push(<div key={`empty-${i}`} className="border rounded-md p-2 h-24"></div>);
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const status = attendanceMap.get(date.toDateString());
                const { color, label } = getStatusInfo(status);
                days.push(
                    <div key={day} className={`border rounded-md p-2 h-24 flex flex-col ${color}`}>
                        <span className="font-bold">{day}</span>
                        <span className="text-xs mt-auto">{label}</span>
                    </div>
                );
            }
            return days;
        };

        const renderListView = () => {
            const days = [];
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const status = attendanceMap.get(date.toDateString());
                if (status && (status.check_in_time || status.check_out_time)) {
                    const { color, icon, label } = getStatusInfo(status);
                    days.push(
                        <div key={day} className={`flex items-center justify-between p-3 rounded-lg ${color}`}>
                            <div className="flex items-center gap-3">
                                {icon}
                                <div>
                                    <span className="font-semibold">{date.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                                    <div className="text-sm text-gray-500">
                                        {status.check_in_time && <span>In: {new Date(status.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        {status.check_in_time && status.check_out_time && <span className="mx-1">|</span>}
                                        {status.check_out_time && <span>Out: {new Date(status.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-sm font-semibold ${color.replace('bg-', 'text-')}`}>{label}</div>
                        </div>
                    );
                }
            }
            return days.length > 0 ? days : <p className="text-center text-gray-500 py-4">No attendance records for this month.</p>;
        };

        if (isHistoryLoading) return <LoadingSpinner text="Loading history..." />;

        return (
            <div className="bg-white p-2 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(new Date(year, month - 2, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft /></button>
                    <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => setCurrentDate(new Date(year, month, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight /></button>
                </div>
                
                <div className="hidden md:block">
                    <div className="grid grid-cols-7 gap-2 text-center font-semibold mb-2">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {renderCalendar()}
                    </div>
                </div>

                <div className="md:hidden space-y-3">
                    {renderListView()}
                </div>
            </div>
        );
    };

    if (isStatusLoading) {
        return <LoadingSpinner text="Checking attendance status..."/>;
    }

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Teacher Attendance</h1>
                <button onClick={() => setView(view === 'actions' ? 'history' : 'actions')} className="text-blue-600 hover:underline">
                    {view === 'actions' ? 'View History' : 'Show Actions'}
                </button>
            </div>
            
            {isRegisterModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Register Device</h2>
                        <p className="text-gray-600 mb-4">Please provide a name for this device and a recovery code. The recovery code will be used if you lose access to this device.</p>
                        <div className="mb-4">
                            <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700">Device Name</label>
                            <input
                                type="text"
                                id="deviceName"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g., My iPhone"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="registrationRecoveryCode" className="block text-sm font-medium text-gray-700">Recovery Code</label>
                            <input
                                type="password"
                                id="registrationRecoveryCode"
                                value={registrationRecoveryCode}
                                onChange={(e) => setRegistrationRecoveryCode(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Create a secure recovery code"
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsRegisterModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                            <button onClick={handleRegistrationSubmit} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                                {isLoading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isRecoveryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Reason for Recovery Code</h2>
                        <p className="text-gray-600 mb-4">Please provide a reason for using the recovery code. This will be logged for administrative review.</p>
                        <div className="mb-4">
                            <label htmlFor="recoveryReason" className="block text-sm font-medium text-gray-700">Reason</label>
                            <textarea
                                id="recoveryReason"
                                value={recoveryReason}
                                onChange={(e) => setRecoveryReason(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g., I forgot my phone at home."
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsRecoveryModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                            <button onClick={handleRecoverySubmit} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                                {isLoading ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'actions' ? (
                <>
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h2 className="text-lg font-semibold mb-2">Today's Status</h2>
                        <p className="text-gray-600">Status: <span className="font-bold text-blue-600">{status?.status || 'Not Checked In'}</span></p>
                        {status?.check_in_time && <p>Checked In: {new Date(status.check_in_time).toLocaleTimeString()}</p>}
                        {status?.check_out_time && <p>Checked Out: {new Date(status.check_out_time).toLocaleTimeString()}</p>}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Map</h2>
                            <div className="flex items-center gap-2">
                                <select
                                    onChange={handleFenceChange}
                                    value={selectedGeoFence?.id || ''}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    disabled={geoFences.length === 0}
                                >
                                    {geoFences.map(fence => (
                                        <option key={fence.id} value={fence.id}>
                                            {fence.name}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={handleFocusClick} className="p-2 rounded-full hover:bg-gray-100" title="Focus on my location">
                                    <Crosshair className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <MapView teacherLocation={teacherLocation} geoFence={selectedGeoFence} focusOn={focusOn} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h2 className="text-lg font-semibold mb-4">Actions</h2>
                        {!status?.is_device_registered && (
                            <>
                                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                                    <p className="font-bold">Warning</p>
                                    <p>Please ensure you are using your own personal device. This device will be used for biometric authentication for all future check-ins and check-outs.</p>
                                </div>
                                <button onClick={handleRegisterDevice} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                                    <Fingerprint /> {isLoading ? 'Registering...' : 'Register This Device'}
                                </button>
                            </>
                        )}
                        {status?.is_device_registered && !status?.check_in_time && (
                            <button onClick={handleCheckIn} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                                <MapPin /> {isLoading ? 'Checking In...' : 'Check In'}
                            </button>
                        )}
                        {status?.is_device_registered && status?.check_in_time && !status?.check_out_time && (
                            <button onClick={handleCheckOut} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                                <MapPin /> {isLoading ? 'Checking Out...' : 'Check Out'}
                            </button>
                        )}
                        {status?.check_in_time && status?.check_out_time && (
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                                <h3 className="mt-2 text-base font-semibold text-green-800">Attendance Complete</h3>
                                <p className="mt-1 text-sm text-green-700">You have successfully checked in and out for the day.</p>
                            </div>
                        )}
                    </div>
                    
                    {status?.check_in_time && !status?.check_out_time ? (
                        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-6">
                            <h2 className="text-lg font-semibold mb-4 text-yellow-800">Device Unavailable for Check-out?</h2>
                            <p className="text-sm text-yellow-700 mb-4">If you cannot use your registered device to check out, you can use the same recovery code.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={recoveryCode}
                                    onChange={(e) => setRecoveryCode(e.target.value)}
                                    placeholder="Enter recovery code"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                />
                                <button onClick={handleRecoveryCheckOut} disabled={isLoading} className="flex items-center justify-center gap-2 bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400">
                                   <KeyRound /> Submit
                                </button>
                            </div>
                        </div>
                    ) : !status?.check_in_time && (
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
                </>
            ) : (
                renderHistoryView()
            )}
        </div>
    );
};

export default TeacherAttendanceView;