// import { verify } from '@noble/ed25519';
// import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// import bs58 from 'bs58';
// import { FC, useCallback, useState, useEffect } from 'react';
// import { notify } from "../utils/notifications";
// import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor';
// import idl from "./journalapp.json";
// import { Journalapp } from "./journalapp";
// import { PublicKey } from '@solana/web3.js';

import { verify } from '@noble/ed25519';
import { useWallet , useConnection} from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback , useState, useEffect} from 'react';
import { notify } from "../utils/notifications";
import { Program, AnchorProvider, utils,web3, BN, setProvider } from '@coral-xyz/anchor';
import  idl from "./journalapp.json";
import {Journalapp} from "./journalapp";
import { PublicKey } from '@solana/web3.js';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.address);

interface JournalEntry {
    title: string;
    message: string;
    pubkey: PublicKey;
}

export const Tank: FC = () => {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const ourWallet = useWallet();
    const getProvider = () => {
        if (!publicKey) throw new Error("Wallet not connected!");
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        setProvider(provider);
        return provider;
    };

    const createJournal = async (title: string, message: string) => {
        if (!title || !message) {
            notify({ type: 'error', message: 'Title and message are required!' });
            return;
        }
        
        setLoading(true);
        try {
            const anchProvider = getProvider();
            const program = new Program<Journalapp>(idl_object, anchProvider);
            
            await program.methods.createJournalEntry(
                title,
                message,
            ).accounts({
                owner: anchProvider.publicKey,
                // Add any other required accounts from your IDL
            }).rpc();
            
            notify({ type: 'success', message: 'Journal created successfully!' });
            await getJournals(); // Refresh the list
            // setTitle(title);
            // setMessage(message);
        } catch (error) {
            console.error(`Error while creating a Journal Entry:`, error);
            notify({ type: 'error', message: 'Failed to create journal entry' });
        } finally {
            setLoading(false);
        }
    };

    const getJournals = async () => {
        setLoading(true);
        try {
            const anchProvider = getProvider();
            const program = new Program<Journalapp>(idl_object,  anchProvider);
            
            const journalAccounts = await connection.getParsedProgramAccounts(programID);
            const journalEntries = await Promise.all(
                journalAccounts.map(async journal => ({
                    ...(await program.account.journalEntryState.fetch(journal.pubkey)),
                    pubkey: journal.pubkey
                }))
            );
            
            setJournals(journalEntries);
        } catch (error) {
            console.error("Error while getting Journals:", error);
            notify({ type: 'error', message: 'Failed to fetch journals' });
        } finally {
            setLoading(false);
        }
    };

    const updateJournal = async (title: string, message: string) => {
        if (!title || !message) {
            notify({ type: 'error', message: 'Title and message are required!' });
            return;
        }

        setLoading(true);
        try {
            const anchProvider = getProvider();
            const program = new Program<Journalapp>(idl_object,  anchProvider);
            
            await program.methods.updateJournalEntry(
                title,
                message,
            ).accounts({
                owner: anchProvider.publicKey,
                
                // Add other required accounts
            }).rpc();
            
            notify({ type: 'success', message: 'Journal updated successfully!' });
            await getJournals(); // Refresh the list
        } catch (error) {
            console.error(`Error while updating Journal Entry:`, error);
            notify({ type: 'error', message: 'Failed to update journal entry' });
        } finally {
            setLoading(false);
        }
    };

    const deleteJournal = async (title:string) => {
        setLoading(true);
        try {
            const anchProvider = getProvider();
            const program = new Program<Journalapp>(idl_object, anchProvider);
            
            await program.methods.deleteJournalEntry(title).accounts({
                owner: anchProvider.publicKey,
                // Add other required accounts
            }).rpc();
            
            notify({ type: 'success', message: 'Journal deleted successfully!' });
            await getJournals(); // Refresh the list
        } catch (error) {
            console.error(`Error while deleting Journal Entry:`, error);
            notify({ type: 'error', message: 'Failed to delete journal entry' });
        } finally {
            setLoading(false);
        }
    };
 
    // Fetch journals on component mount
    useEffect(() => {
        if (publicKey) {
            getJournals();
        }
    }, [publicKey]);

    return (
        <div className="container mx-auto p-4 flex flex-row">
            {/* Create Journal Form */}
            <div className="mb-8 p-4 border rounded-lg flex flex-col">
                <input 
                    type="text"
                    placeholder="Enter Title"
                    className="w-full p-2 mb-4 border rounded text-black"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                    placeholder="Enter Message"
                    className="w-full p-2 mb-4 border rounded text-black"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                />
                <div className="flex gap-4">
                    <button
                        className="flex-1 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-white disabled:opacity-50"
                        onClick={() => createJournal(title, message)}
                        disabled={!publicKey || loading}
                    >
                        {loading ? 'Creating...' : 'Create Journal'}
                    </button>
                    <button
                        className="flex-1 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-white disabled:opacity-50"
                        onClick={getJournals}
                        disabled={!publicKey || loading}
                    >
                        {loading ? 'Loading...' : 'Refresh Journals'}
                    </button>
                </div>
            </div>
             {/* Journal List */}
             <div className="flex flex-row">
            <div className="space-y-4">
                {journals.map((journal) => (
                    <div key={journal.pubkey.toString()} className="p-4 border rounded-lg">
                        <input
                            type="text"
                            className="w-full p-2 mb-2 border rounded text-black"
                            disabled = {true}
                            defaultValue={journal.title.toString()}
                            onChange={(e) => journal.title = e.target.value}
                        />
                        <textarea
                            className="w-full p-2 mb-4 border rounded text-black"
                            defaultValue={journal.message.toString()}
                            onChange={(e) => journal.message = e.target.value}
                            rows={3}
                        />
                        <div className="flex gap-4">
                            <button
                                className="flex-1 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-white"
                                onClick={() => updateJournal(journal.title, journal.message)}
                                disabled={loading}
                            >
                                Update
                            </button>
                            <button
                                className="flex-1 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-white"
                                onClick={() => deleteJournal(journal.title)}
                                disabled={loading}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
};



