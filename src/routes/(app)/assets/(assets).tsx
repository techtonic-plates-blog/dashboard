import { Title } from "@solidjs/meta";
import DataTable from "~/components/ui/data-table";
import { createResource, ErrorBoundary, Match, Show, Suspense, Switch, createSignal, For, createEffect, Accessor } from "solid-js";
import { assetsClient } from "~/lib/client";
import { A, createAsync, query, RouteDefinition, action, useAction } from "@solidjs/router";
import type { Column } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";
import { components } from "$api/assets-client";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Upload, Trash2, Eye, FileIcon, ImageIcon, VideoIcon, FileTextIcon, X } from "lucide-solid";
import { useAuth } from "~/lib/providers/auth-provider";
import { hasPermission, PERMISSIONS } from "~/lib/permissions";
import PermissionGuard from "~/components/permission-guard";

type AssetInfo = components["schemas"]["AssetInfo"];

const assetsDataQuery = query(async () => {
    "use server";

    const { data: getAssets, response: getAssetsResponse } = await assetsClient.GET("/assets");

    if (!getAssets) {
        const err = await getAssetsResponse.text();
        throw new Error(`Failed to fetch assets: ${err}`);
    }

    const assetNames = getAssets.assets;
   // console.log("Asset names:", assetNames);

    if (assetNames.length === 0) {
        return [];
    }
    const { data: batchData, response: batchResponse } = await assetsClient.POST("/assets/batch/info", {
        body: {
            asset_names: assetNames
        }
    });

    if (!batchData) {
        const err = await batchResponse.text();
        throw new Error(`Failed to fetch asset details: ${err}`);
    }

   // console.log(batchData)

    return batchData.assets;
}, "assetsDataQuery");
const uploadAssetAction = action(async (formData: FormData) => {
    "use server";

    const file = formData.get('asset') as File;
    if (!file) {
        throw new Error('No file provided');
    }
    const uploadFormData = new FormData();
    uploadFormData.append('asset', file);

    const { response } = await assetsClient.PUT("/assets", {
        body: uploadFormData as any,
        parseAs: "text"
    });

    if (!response.ok) {
        console.log("Upload failed:", response.statusText);
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    return { success: true };
}, "uploadAsset");

const deleteAssetAction = action(async (assetName: string) => {
    "use server";

    const { response } = await assetsClient.DELETE("/assets/{asset}", {
        params: {
            path: {
                asset: assetName
            }
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${errorText || response.statusText}`);
    }

    return { success: true };
}, "deleteAsset");

export const route = {
    preload: () => {
        assetsDataQuery().catch((e) => {
            console.error("Failed to preload assets:", e);
        });
    }
} satisfies RouteDefinition;

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

function getFileTypeIcon(filename: string) {
    const extension = getFileExtension(filename);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];

    if (imageExtensions.includes(extension)) {
        return <ImageIcon class="w-4 h-4" />;
    } else if (videoExtensions.includes(extension)) {
        return <VideoIcon class="w-4 h-4" />;
    } else if (audioExtensions.includes(extension)) {
        return (
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.18-.32-2.294-.857-3.243a1 1 0 010-1.414zm-2.829 2.829a1 1 0 011.414 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.758 2.828 1 1 0 01-1.414-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.414 1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        );
    } else if (documentExtensions.includes(extension)) {
        return <FileTextIcon class="w-4 h-4" />;
    }
    return <FileIcon class="w-4 h-4" />;
}

function isImageFile(filename: string): boolean {
    const extension = getFileExtension(filename);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    return imageExtensions.includes(extension);
}

function isVideoFile(filename: string): boolean {
    const extension = getFileExtension(filename);
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    return videoExtensions.includes(extension);
}

function isAudioFile(filename: string): boolean {
    const extension = getFileExtension(filename);
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
    return audioExtensions.includes(extension);
}

function AssetViewer(props: { asset: AssetInfo }) {
    const [isOpen, setIsOpen] = createSignal(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
    const deleteAction = useAction(deleteAssetAction);

    const assetUrl = () => {
        if (!isOpen()) return null;
        // Use the API route to stream the asset
        return `/assets/${encodeURIComponent(props.asset.name)}`;
    };

    const handleDelete = async () => {
        try {
            await deleteAction(props.asset.name);
            setIsOpen(false);
            setShowDeleteConfirm(false);
            // Refresh the data
            window.location.reload();
        } catch (error) {
            console.error('Delete failed:', error);
            // You could add a toast notification here
        }
    };


    const renderAssetPreview = () => {
        const url = assetUrl();
        if (!url) return null;

        if (isImageFile(props.asset.name)) {
            return (
                <img
                    src={url}
                    alt={props.asset.name}
                    class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style="max-height: calc(90vh - 200px);"
                />
            );
        }

        if (isVideoFile(props.asset.name)) {
            return (
                <video
                    src={url}
                    controls
                    class="max-w-full max-h-full rounded-lg shadow-lg"
                    style="max-height: calc(90vh - 200px);"
                    preload="metadata"
                >
                    Your browser does not support the video element.
                </video>
            );
        }

        if (isAudioFile(props.asset.name)) {
            return (
                <div class="flex flex-col items-center space-y-4">
                    <div class="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.18-.32-2.294-.857-3.243a1 1 0 010-1.414zm-2.829 2.829a1 1 0 011.414 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.758 2.828 1 1 0 01-1.414-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.414 1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <audio
                        src={url}
                        controls
                        class="w-full max-w-md"
                        preload="metadata"
                    >
                        Your browser does not support the audio element.
                    </audio>
                    <div class="text-center">
                        <p class="text-sm font-medium text-gray-700">{props.asset.name}</p>
                        <p class="text-xs text-gray-500">{formatFileSize(props.asset.size)}</p>
                    </div>
                </div>
            );
        }

        // For other file types, show a generic file icon with download option
        return (
            <div class="flex flex-col items-center space-y-4">
                <div class="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getFileTypeIcon(props.asset.name)}
                </div>
                <div class="text-center">
                    <p class="text-sm font-medium text-gray-700">{props.asset.name}</p>
                    <p class="text-xs text-gray-500">{formatFileSize(props.asset.size)}</p>
                    <p class="text-xs text-gray-400 mt-1">Preview not available for this file type</p>
                </div>
                <Button
                    as="a"
                    href={url}
                    download={props.asset.name}
                    size="sm"
                    class="gap-2"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                </Button>
            </div>
        );
    };

    return (
        <Dialog open={isOpen()} onOpenChange={setIsOpen}>
            <DialogTrigger as={Button} size="sm" variant="outline" class="gap-2">
                <Eye class="w-3 h-3" />
                View
            </DialogTrigger>
            <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader class="flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle class="flex items-center gap-2">
                            {getFileTypeIcon(props.asset.name)}
                            {props.asset.name}
                        </DialogTitle>
                        <DialogDescription>
                            {formatFileSize(props.asset.size)} • Last modified: {new Date(props.asset.last_modified).toLocaleString()}
                        </DialogDescription>
                    </div>
                    <div class="flex items-center gap-2">
                        <PermissionGuard
                            user={useAuth().user()}
                            permission={PERMISSIONS.DELETE_ASSET}
                            fallback={
                                <Tooltip>
                                    <TooltipTrigger as={Button} variant="ghost" size="sm" disabled class="h-8 w-8 p-0">
                                        <Trash2 class="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>You don't have permission to delete assets</p>
                                    </TooltipContent>
                                </Tooltip>
                            }
                        >
                            <Tooltip>
                                <TooltipTrigger as={Button} 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    class="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 class="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Delete asset</p>
                                </TooltipContent>
                            </Tooltip>
                        </PermissionGuard>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            class="h-8 w-8 p-0"
                        >
                            <X class="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div class="flex-1 flex items-center justify-center p-4 min-h-[400px]">
                    <Suspense fallback={
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p class="text-sm text-gray-600">Loading asset...</p>
                        </div>
                    }>
                        <ErrorBoundary fallback={(err, reset) => (
                            <div class="text-center">
                                <FileIcon class="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                <p class="text-red-600 mb-2">{err.message}</p>
                                <Button onClick={reset} size="sm">Try Again</Button>
                            </div>
                        )}>
                            <Show when={assetUrl()}>
                                {renderAssetPreview()}
                            </Show>
                        </ErrorBoundary>
                    </Suspense>
                </div>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm()} onOpenChange={setShowDeleteConfirm}>
                <DialogContent class="max-w-md">
                    <DialogHeader>
                        <DialogTitle class="flex items-center gap-2 text-red-600">
                            <Trash2 class="h-5 w-5" />
                            Delete Asset
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{props.asset.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div class="flex justify-end gap-3 mt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                            class="gap-2"
                        >
                            <Trash2 class="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}

const columns: Column<AssetInfo>[] = [
    {
        key: "name",
        label: "Name",
        filterable: true,
        sortable: true,
        render: (value: string) => (
            <div class="flex items-center gap-2">
                {getFileTypeIcon(value)}
                <span class="truncate">{value}</span>
            </div>
        ),
        priority: 10
    },
    {
        key: "size",
        label: "Size",
        sortable: true,
        render: (value: number) => formatFileSize(value),
        priority: 5
    },
    {
        key: "last_modified",
        label: "Last Modified",
        sortable: true,
        render: (value: string) => new Date(value).toLocaleDateString(),
        priority: 3
    },
    {
        key: "name" as keyof AssetInfo,
        label: "Actions",
        render: (value: string, row: AssetInfo) => <AssetViewer asset={row} />,
        priority: 1
    }
];

function AssetUpload() {
    const [isOpen, setIsOpen] = createSignal(false);
    const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
    const [uploadError, setUploadError] = createSignal<string | null>(null);
    const [uploadPending, setUploadPending] = createSignal(false);
    const action = useAction(uploadAssetAction);

    const handleFileSelect = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadError(null);
        }
    };

    const handleUpload = async () => {
        const file = selectedFile();
        if (!file) return;
        console.log("here")
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('asset', file);
            setUploadPending(true);
            await action(formData);
            setUploadPending(false);
            setIsOpen(false);
            setSelectedFile(null);
            // Refresh the data
            window.location.reload();
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    return (
        <Dialog open={isOpen()} onOpenChange={setIsOpen}>
            <DialogTrigger as={Button} class="gap-2">
                <Upload class="w-4 h-4" />
                Upload Asset
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload New Asset</DialogTitle>
                    <DialogDescription>
                        Select a file to upload to the asset storage.
                    </DialogDescription>
                </DialogHeader>
                <div class="space-y-4">
                    <div>
                        <label for="file-upload" class="block text-sm font-medium mb-2">
                            Choose file
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={handleFileSelect}
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    <Show when={selectedFile()}>
                        <div class="p-3 bg-gray-50 rounded-md">
                            <p class="text-sm">
                                <strong>Selected:</strong> {selectedFile()?.name}
                            </p>
                            <p class="text-sm text-gray-600">
                                Size: {selectedFile() ? formatFileSize(selectedFile()!.size) : ''}
                            </p>
                        </div>
                    </Show>
                    <Show when={uploadError()}>
                        <div class="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p class="text-sm text-red-600">{uploadError()}</p>
                        </div>
                    </Show>
                    <div class="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile() || uploadPending()}
                        >
                            {uploadPending() ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Assets() {
    const { user } = useAuth();
    const assets = createAsync(() => assetsDataQuery());

    const handleRowClick = (asset: AssetInfo) => {
        // For now, we'll show asset details in console
        // In a real app, you might want to open a modal with asset details
        console.log('Asset clicked:', asset);
    };

    return (
        <section>
            <Title>Asset Manager</Title>
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Asset Manager</h1>
                    <p class="text-gray-600">Manage and organize your media assets</p>
                </div>
                <PermissionGuard
                    user={user()}
                    permission={PERMISSIONS.ADD_ASSET}
                    fallback={null}
                >
                    <AssetUpload />
                </PermissionGuard>
            </div>

            <div class="grid gap-6">


                <section>
                    <ErrorBoundary fallback={(err, reset) => (
                        <Card>
                            <CardContent class="p-6">
                                <div class="text-center">
                                    <p class="text-red-600 mb-4">Error loading assets: {err.message}</p>
                                    <Button onClick={reset}>Try Again</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}>
                        <Suspense fallback={
                            <Card>
                                <CardContent class="p-6">
                                    <div class="text-center">Loading assets...</div>
                                </CardContent>
                            </Card>
                        }>
                            <Show
                                when={assets() && assets()!.length > 0}
                                fallback={
                                    <Card>
                                        <CardContent class="p-6">
                                            <div class="text-center">
                                                <FileIcon class="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                                <p class="text-gray-600 mb-4">No assets found</p>

                                            </div>
                                        </CardContent>
                                    </Card>
                                }
                            >
                                <Card class="mb-4">
                                    <CardHeader>
                                        <CardTitle>Asset Statistics</CardTitle>
                                        <CardDescription>Overview of your asset storage</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div class="text-center">
                                                <p class="text-2xl font-bold">{assets()?.length || 0}</p>
                                                <p class="text-sm text-gray-600">Total Assets</p>
                                            </div>
                                            <div class="text-center">
                                                <p class="text-2xl font-bold">
                                                    {formatFileSize(assets()?.reduce((total, asset) => total + asset.size, 0) || 0)}
                                                </p>
                                                <p class="text-sm text-gray-600">Total Size</p>
                                            </div>
                                            <div class="text-center">
                                                <p class="text-2xl font-bold">
                                                    {new Set(assets()?.map(asset => getFileExtension(asset.name))).size || 0}
                                                </p>
                                                <p class="text-sm text-gray-600">File Types</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <DataTable
                                    data={assets()!}
                                    pageSize={10}
                                    columns={columns}
                                    searchableColumns={["name"]}
                                    title="Assets"
                                    description="Browse and manage your assets"
                                    onRowClick={handleRowClick}
                                    emptyMessage="No assets found. Upload your first asset to get started."
                                    
                                />
                            </Show>
                        </Suspense>
                    </ErrorBoundary>
                </section>
            </div>
        </section>
    );
}