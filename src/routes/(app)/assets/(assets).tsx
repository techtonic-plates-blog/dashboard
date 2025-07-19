import { Title } from "@solidjs/meta";
import DataTable from "~/components/ui/data-table";
import { createResource, ErrorBoundary, Match, Show, Suspense, Switch, createSignal, For, createEffect } from "solid-js";
import { assetsClient } from "~/lib/client";
import { A, createAsync, query, RouteDefinition, action, useSubmission, useAction } from "@solidjs/router";
import type { Column } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";
import { components } from "$api/assets-client";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";
import { Download, Upload, Trash2, Eye, FileIcon, ImageIcon, VideoIcon, FileTextIcon, X } from "lucide-solid";
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
    console.log("Asset names:", assetNames);

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

    console.log(batchData)

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

const getAssetAction = action(async (assetName: string) => {
    "use server";

    const { data, response, error } = await assetsClient.GET("/assets/{asset}", {
        params: {
            path: {
                asset: assetName
            }
        },
        parseAs: "blob"
    });

    if (!response.ok || !data) {
        throw new Error(`Failed to load asset: ${error}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64 efficiently for large files
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    return {
        data: `data:${data.type};base64,${base64}`,
        contentType: data.type
    };
}, "getAsset");

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
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];

    if (imageExtensions.includes(extension)) {
        return <ImageIcon class="w-4 h-4" />;
    } else if (videoExtensions.includes(extension)) {
        return <VideoIcon class="w-4 h-4" />;
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

function AssetViewer(props: { asset: AssetInfo, isOpen: boolean, onClose: () => void }) {
    const [assetUrl, setAssetUrl] = createSignal<string | null>(null);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const getAsset = useAction(getAssetAction);

    const loadAsset = async () => {
        if (!props.isOpen) return;

        setLoading(true);
        setError(null);

        try {
            const result = await getAsset(props.asset.name);
            setAssetUrl(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load asset');
        } finally {
            setLoading(false);
        }
    };

    // Load asset when dialog opens
    createEffect(() => {
        if (props.isOpen) {
            loadAsset();
        } else {
            // Clear the asset URL when dialog closes
            setAssetUrl(null);
        }
    });

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

    };

    return (
        <Dialog open={props.isOpen} onOpenChange={(open) => { if (!open) props.onClose(); }}>
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={props.onClose}
                        class="h-6 w-6 p-0"
                    >
                        <X class="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div class="flex-1 flex items-center justify-center p-4 min-h-[400px]">
                    <Show when={loading()}>
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p class="text-sm text-gray-600">Loading asset...</p>
                        </div>
                    </Show>

                    <Show when={error()}>
                        <div class="text-center">
                            <FileIcon class="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p class="text-red-600 mb-2">{error()}</p>
                            <Button onClick={loadAsset} size="sm">Try Again</Button>
                        </div>
                    </Show>

                    <Show when={!loading() && !error() && assetUrl()}>
                        {renderAssetPreview()}
                    </Show>
                </div>
            </DialogContent>
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
        render: (value: string, row: AssetInfo) => <AssetActions asset={row} />,
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

function AssetActions(props: { asset: AssetInfo }) {
    const [showViewer, setShowViewer] = createSignal(false);

    const handleView = () => {
        setShowViewer(true);
    };

    const handleDownload = () => {
        // For now, show instructions to download
        alert(`To download ${props.asset.name}, please use the API directly or contact your administrator.`);
    };

    return (
        <>
            <div class="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleView} class="gap-2">
                    <Eye class="w-3 h-3" />
                    View
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} class="gap-2">
                    <Download class="w-3 h-3" />
                    Download
                </Button>
            </div>
            <AssetViewer
                asset={props.asset}
                isOpen={showViewer()}
                onClose={() => setShowViewer(false)}
            />
        </>
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
                                <Card>
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