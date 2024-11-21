"use client";
import { invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';
import { useState, useEffect } from "react";
import crypto from "crypto";
import { exportJWK } from 'jose';
import { AiOutlineLoading3Quarters } from "react-icons/ai";

async function generateClientKey() {
    const algorithm = {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
    };

    const keyPair = await window.crypto.subtle.generateKey(
        algorithm,
        true,
        ['encrypt', 'decrypt']
    );

    const publicKey = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return { publicKey, privateKey };
}

async function decryptData(encryptedData: string, privateKey: JsonWebKey): Promise<string> {
    const { importJWK, compactDecrypt } = await import('jose');

    //@ts-ignore
    const importedPrivateKey = await importJWK(privateKey, 'RSA-OAEP');
    const { plaintext } = await compactDecrypt(encryptedData, importedPrivateKey);

    return new TextDecoder().decode(plaintext);
}

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [clientKeys, setClientKeys] = useState<{ publicKey: JsonWebKey, privateKey: JsonWebKey } | null>(null);

    const setVars = async () => {
        const store = await load('settings.json', { autoSave: false });
        const apiKey = await store.get<{ value: string }>('apiKey');

        if (apiKey?.value) {
            console.log(apiKey.value);
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
        setLoading(false);
    }

    const login = async () => {
        setLoading(true);
        // Generate client key pair
        const keyPair = await generateClientKey();
        setClientKeys(keyPair);

        // Convert public key to Base64 encoded string
        const publicKeyString = JSON.stringify(keyPair.publicKey);
        const base64EncodedKey = btoa(publicKeyString);

        // Open authentication URL with Base64 encoded public key
        await invoke('open_url', { url: `https://sukusho.cloud/appauth/${base64EncodedKey}` });

        // Poll for authentication result
        while (true) {
            try {
                let res = await fetch(`https://sukusho.cloud/api/appauth/get/${base64EncodedKey}`);
                if (res.ok) {
                    let data = await res.json();
                    if (data !== null) {
                        // Decrypt the API key using the private key
                        const apiKey = await decryptData(data.key, keyPair.privateKey);
                        console.log(apiKey);

                        const store = await load('settings.json', { autoSave: false });
                        await store.set('apiKey', { value: apiKey });
                        await store.save();

                        setLoggedIn(true);
                        setLoading(false);
                        break;
                    }
                }
            } catch (e) {
                console.error(e);
            }
            await new Promise(r => setTimeout(r, 5000));
        }
    };

    useEffect(() => {
        setVars();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <AiOutlineLoading3Quarters className="animate-spin text-white" size={32}/>
            </div>
        );
    }

    if (!loggedIn) {
        return (
            <div className="flex flex-col space-y-4 items-center justify-center h-screen">
                <h1 className="text-2xl font-bold text-white">Log in to sukushocloud</h1>
                <button className="px-4 py-2 bg-primary text-white rounded-lg" onClick={() => login()}>Log in</button>
            </div>
        );
    }

    return (
        <div className="">
            <h1 className="text-4xl font-bold text-white">Hello, world!</h1>
        </div>
    );
}