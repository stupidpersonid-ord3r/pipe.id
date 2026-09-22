import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Image as ImageIcon,
  Save,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react";
import { pipeApi } from "../../lib/pipeApi";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useLanguage } from "../../hooks/useLanguage";
import PhotoAdjuster from "../../components/PhotoAdjuster";

const defaultSettings = {
  traderName: "",
  journalName: "PIPE.ID",
  theme: "light",
  avatarUrl: "",
};

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    return;
  }

  if (theme === "light") {
    root.classList.remove("dark");
    return;
  }

  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  root.classList.toggle("dark", prefersDark);
}


function ProfileSettings() {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { t } = useLanguage();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const [settings, setSettings] =
    useState(defaultSettings);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);
  const [deletingAvatar, setDeletingAvatar] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");
  const [profileError, setProfileError] =
    useState("");

  const [showPhotoMenu, setShowPhotoMenu] =
    useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [showCamera, setShowCamera] =
    useState(false);
  const [cameraFacing, setCameraFacing] =
    useState("user");
  const [cameraReady, setCameraReady] =
    useState(false);
  const [cameraError, setCameraError] =
    useState("");

  const [photoSource, setPhotoSource] =
    useState("");

  const traderInitial =
    settings.traderName?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "T";

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      setProfileError("");

      let data;
      try {
        data = await pipeApi.profile.get();
      } catch (error) {
        setProfileError(error.message);
        return;
      }

      const nextSettings = {
        traderName:
          data?.trader_name ||
          user.email?.split("@")[0] ||
          "Trader",

        journalName:
          data?.journal_name === "Pipfolio" ||
          data?.journal_name === "Trading Journal"
            ? "PIPE.ID"
            : data?.journal_name || "PIPE.ID",

        theme: data?.theme || "light",

        avatarUrl: data?.avatar_url || "",
      };

      setSettings(nextSettings);

      localStorage.setItem(
        "trading_journal_theme",
        nextSettings.theme,
      );

      applyTheme(nextSettings.theme);

    }

    loadProfile();
  }, [user]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const overlayOpen =
      showCamera ||
      Boolean(photoSource) ||
      showDeleteConfirm;

    if (!overlayOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;
    const previousTouchAction =
      document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow =
        previousOverflow;
      document.body.style.touchAction =
        previousTouchAction;
    };
  }, [
    showCamera,
    photoSource,
    showDeleteConfirm,
  ]);

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: value,
    }));

    setProfileMessage("");
    setProfileError("");
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!user) return;

    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    const traderName =
      settings.traderName.trim() ||
      user.email?.split("@")[0] ||
      "Trader";

    const journalName =
      settings.journalName.trim() ||
      "PIPE.ID";

    try {
      await updateProfile({
        traderName,
        journalName,
        theme: settings.theme,
        avatarUrl: settings.avatarUrl || "",
      });
    } catch (error) {
      setProfileError(
        error.message ||
          "Failed to save profile.",
      );
      setSavingProfile(false);
      return;
    }

    setSettings((current) => ({
      ...current,
      traderName,
      journalName,
    }));

    localStorage.setItem(
      "trading_journal_theme",
      settings.theme,
    );

    applyTheme(settings.theme);

    window.dispatchEvent(
      new CustomEvent("profilechange", {
        detail: {
          traderName,
          journalName,
          avatarUrl:
            settings.avatarUrl || "",
        },
      }),
    );

    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: settings.theme,
      }),
    );

    setProfileMessage(
      "Profile saved successfully.",
    );
    setSavingProfile(false);
  }

  function handleChoosePhoto() {
    setShowPhotoMenu((current) => !current);
  }

  function handleGallery() {
    setShowPhotoMenu(false);
    fileInputRef.current?.click();
  }

  function isMobileDevice() {
    return (
      /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent,
      ) ||
      (navigator.maxTouchPoints > 1 &&
        window.matchMedia?.(
          "(max-width: 1024px)",
        )?.matches)
    );
  }

  function openCameraForFacing(
    facingMode = "user",
  ) {
    setShowPhotoMenu(false);
    setCameraFacing(facingMode);
    startCamera(facingMode);
  }

  function handleMobileCameraUpload(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const validationError =
      validateImage(file);

    if (validationError) {
      setProfileError(validationError);
      return;
    }

    setProfileError("");

    const url = URL.createObjectURL(file);

    setPhotoSource(url);
  }

  function validateImage(file) {
    if (!file) {
      return "No image selected.";
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, PNG, and WebP images are allowed.";
    }

    const maxSourceSize =
      12 * 1024 * 1024;

    if (file.size > maxSourceSize) {
      return "Profile image must be smaller than 12 MB.";
    }

    return null;
  }

  async function uploadAvatar(file) {
    if (!file || !user) return;
    const validationError = validateImage(file);
    if (validationError) { setProfileError(validationError); return; }
    setProfileMessage(""); setProfileError(""); setUploadingAvatar(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read profile image."));
        reader.readAsDataURL(file);
      });
      if (!dataUrl) throw new Error("Profile image could not be prepared.");
      const data = await pipeApi.profile.update({ avatarUrl: dataUrl });
      const avatarUrl = data?.avatar_url || dataUrl;
      setSettings((current) => ({ ...current, avatarUrl }));
      window.dispatchEvent(new CustomEvent("profilechange", { detail: { traderName: settings.traderName, journalName: settings.journalName, avatarUrl } }));
      setProfileMessage("Profile photo updated successfully.");
    } catch (error) {
      console.error("Avatar upload error:", error);
      setProfileError(error.message || "Failed to upload profile photo.");
    } finally { setUploadingAvatar(false); }
  }

  function handleGalleryUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError =
      validateImage(file);

    if (validationError) {
      setProfileError(validationError);
      event.target.value = "";
      return;
    }

    setProfileError("");

    const url =
      URL.createObjectURL(file);

    setPhotoSource(url);

    event.target.value = "";
  }

  async function startCamera(
    facingMode = "user",
  ) {
    setCameraError("");
    setCameraReady(false);

    stopCamera();

    try {
      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          "Camera API is not available in this browser.",
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: {
                ideal: facingMode,
              },
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
            },
            audio: false,
          },
        );

      cameraStreamRef.current = stream;

      setCameraFacing(facingMode);
      setShowCamera(true);

      window.setTimeout(() => {
        if (!cameraVideoRef.current) {
          return;
        }

        cameraVideoRef.current.srcObject =
          stream;

        cameraVideoRef.current
          .play()
          .catch(() => {});

        setCameraReady(true);
      }, 50);
    } catch (error) {
      console.error(
        "Camera error:",
        error,
      );

      let message =
        "Unable to access camera.";

      if (
        error?.name ===
        "NotAllowedError"
      ) {
        message =
          "Camera permission was denied. Please allow camera access in your browser.";
      }

      if (
        error?.name ===
        "NotFoundError"
      ) {
        message =
          "No camera was found on this device.";
      }

      if (
        error?.name ===
        "NotReadableError"
      ) {
        message =
          "Camera is already being used by another application.";
      }

      setCameraError(message);
      setShowCamera(true);

      if (isMobileDevice()) {
        window.setTimeout(() => {
          cameraInputRef.current?.click();
        }, 0);
      }
    }
  }

  function stopCamera() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      cameraStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject =
        null;
    }

    setCameraReady(false);
  }

  function handleOpenCamera() {
    openCameraForFacing("user");
  }

  async function switchCamera() {
    const nextFacing =
      cameraFacing === "user"
        ? "environment"
        : "user";

    await startCamera(nextFacing);
  }

  function closeCamera() {
    stopCamera();

    setShowCamera(false);
    setCameraError("");
  }

  function capturePhoto() {
    const video =
      cameraVideoRef.current;

    if (!video || !cameraReady) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      return;
    }

    const size = Math.min(
      width,
      height,
    );

    const sx =
      (width - size) / 2;

    const sy =
      (height - size) / 2;

    const canvas =
      document.createElement(
        "canvas",
      );

    canvas.width = 512;
    canvas.height = 512;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.save();

    if (cameraFacing === "user") {
      context.translate(512, 0);
      context.scale(-1, 1);
    }

    context.drawImage(
      video,
      sx,
      sy,
      size,
      size,
      0,
      0,
      512,
      512,
    );

    context.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(
            "Failed to capture photo.",
          );
          return;
        }

        const previewUrl =
          URL.createObjectURL(blob);

        stopCamera();
        setShowCamera(false);
        setCameraError("");
        setPhotoSource(previewUrl);
      },
      "image/jpeg",
      0.92,
    );
  }

  async function handleAdjustedPhoto(
    file,
  ) {
    if (!file) return;

    const oldSource = photoSource;

    setPhotoSource("");

    if (oldSource) {
      URL.revokeObjectURL(oldSource);
    }

    await uploadAvatar(file);
  }

  function cancelPhotoAdjustment() {
    const source = photoSource;

    setPhotoSource("");

    if (source) {
      URL.revokeObjectURL(source);
    }

    stopCamera();
    setShowCamera(false);
  }

  async function handleDeleteAvatar() {
    if (!user || !settings.avatarUrl) return;
    setShowPhotoMenu(false); setProfileMessage(""); setProfileError(""); setDeletingAvatar(true);
    try {
      await updateProfile({ avatarUrl: null });
      setSettings((current) => ({ ...current, avatarUrl: "" }));
      window.dispatchEvent(new CustomEvent("profilechange", { detail: { traderName: settings.traderName, journalName: settings.journalName, avatarUrl: "" } }));
      setProfileMessage("Profile photo removed successfully.");
    } catch (error) {
      console.error("Delete avatar error:", error);
      setProfileError(error.message || "Failed to remove profile photo.");
    } finally { setDeletingAvatar(false); setShowDeleteConfirm(false); }
  }

  const cameraOverlay =
    showCamera &&
    createPortal(
      <div className="fixed inset-0 z-[9998] flex h-[100dvh] w-[100vw] items-center justify-center overflow-hidden bg-black">
        <div className="relative flex h-full w-full flex-col bg-black">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
            <button
              type="button"
              onClick={closeCamera}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
              aria-label="Close camera"
            >
              <X size={20} />
            </button>

            <button
              type="button"
              onClick={switchCamera}
              disabled={Boolean(cameraError)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Switch camera"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            {cameraError ? (
              <div className="mx-6 max-w-md rounded-xl bg-black/70 p-5 text-center text-sm text-white">
                {cameraError}
              </div>
            ) : (
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent px-6 pb-8 pt-16">
            <button
              type="button"
              onClick={closeCamera}
              className="min-h-10 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              disabled={!cameraReady || Boolean(cameraError)}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Capture photo"
            >
              <span className="h-12 w-12 rounded-full border border-slate-300" />
            </button>

            <button
              type="button"
              onClick={switchCamera}
              disabled={Boolean(cameraError)}
              className="min-h-10 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ganti
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );

  const deleteOverlay =
    showDeleteConfirm &&
    createPortal(
      <div className="fixed inset-0 z-[9997] flex h-[100dvh] w-[100vw] items-center justify-center overflow-hidden bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <Trash2 size={20} />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Delete profile photo?
              </h3>

              <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                This will permanently
                remove your current
                profile photo. This
                action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setShowDeleteConfirm(
                  false,
                )
              }
              disabled={deletingAvatar}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-900"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={async () => {
                await handleDeleteAvatar();
                setShowDeleteConfirm(
                  false,
                );
              }}
              disabled={deletingAvatar}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:text-white dark:hover:bg-red-600"
            >
              <Trash2 size={16} />

              {deletingAvatar
                ? "Deleting..."
                : t("deletePhoto")}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <div className="page-enter mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your profile,
            appearance, and security.
          </p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300">
                <Camera size={20} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Profile
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "profileDescription",
                  )}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="space-y-6 p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={
                    handleChoosePhoto
                  }
                  disabled={
                    uploadingAvatar ||
                    deletingAvatar
                  }
                  className="group relative block h-24 w-24 overflow-hidden rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  aria-label={t(
                    "profilePhotoActions",
                  )}
                  aria-expanded={
                    showPhotoMenu
                  }
                >
                  {settings.avatarUrl ? (
                    <img
                      src={`${settings.avatarUrl.startsWith("data:") ? settings.avatarUrl : `${settings.avatarUrl}${settings.avatarUrl.includes("?") ? "&" : "?"}v=${Date.now()}`}`}
                      alt={t(
                        "profile",
                      )}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-3xl font-semibold text-white dark:bg-emerald-950">
                      {traderInitial}
                    </div>
                  )}

                  <span className="absolute inset-x-0 bottom-0 bg-slate-950/65 py-1 text-center text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                    {t(
                      "changePhoto",
                    )}
                  </span>

                  {(uploadingAvatar ||
                    deletingAvatar) && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </span>
                  )}
                </button>

                {showPhotoMenu && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 text-slate-800 shadow-[0_20px_50px_rgb(15_23_42/0.16)] ring-1 ring-black/5 backdrop-blur-xl dark:border-emerald-800/70 dark:bg-[#071a14] dark:text-emerald-50 dark:ring-emerald-400/10">
                    <button
                      type="button"
                      onClick={
                        handleOpenCamera
                      }
                      className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-emerald-50 dark:hover:bg-emerald-900/60 dark:[&>svg]:text-emerald-300 [&>svg]:text-slate-500"
                    >
                      <Camera
                        size={17}
                      />
                      {t(
                        "takePhoto",
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleGallery
                      }
                      className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-emerald-50 dark:hover:bg-emerald-900/60 dark:[&>svg]:text-emerald-300 [&>svg]:text-slate-500"
                    >
                      <ImageIcon
                        size={17}
                      />
                      {t(
                        "chooseGallery",
                      )}
                    </button>

                    {settings.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoMenu(
                            false,
                          );
                          setShowDeleteConfirm(
                            true,
                          );
                        }}
                        disabled={
                          deletingAvatar
                        }
                        className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        <Trash2
                          size={17}
                        />
                        {t(
                          "deletePhoto",
                        )}
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={
                    handleGalleryUpload
                  }
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={
                    handleMobileCameraUpload
                  }
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t(
                    "profilePhoto",
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t(
                    "profilePhotoHint",
                  )}
                </p>

                <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                  {t(
                    "tapPhotoToManage",
                  )}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="traderName"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Trader Name
              </label>

              <input
                id="traderName"
                name="traderName"
                type="text"
                value={
                  settings.traderName
                }
                onChange={
                  handleProfileChange
                }
                placeholder={t(
                  "enterTraderName",
                )}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
              />
            </div>

            <div>
              <label
                htmlFor="journalName"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Journal Name
              </label>

              <input
                id="journalName"
                name="journalName"
                type="text"
                value={
                  settings.journalName
                }
                onChange={
                  handleProfileChange
                }
                placeholder={t(
                  "enterJournalName",
                )}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
              />
            </div>

            {profileMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {profileMessage}
              </div>
            )}

            {profileError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {profileError}
              </div>
            )}

            <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
              <button
                type="submit"
                disabled={
                  savingProfile
                }
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 dark:focus:ring-emerald-400 dark:focus:ring-offset-slate-900"
              >
                <Save size={16} />

                {savingProfile
                  ? "Saving..."
                  : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

      </div>

      {cameraOverlay}

      {photoSource && (
        <PhotoAdjuster
          key={photoSource}
          source={photoSource}
          onCancel={cancelPhotoAdjustment}
          onUse={handleAdjustedPhoto}
        />
      )}

      {deleteOverlay}
    </>
  );
}

export default ProfileSettings;