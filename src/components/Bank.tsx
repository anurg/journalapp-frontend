// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useWallet , useConnection} from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback , useState} from 'react';
import { notify } from "../utils/notifications";
import { Program, AnchorProvider, utils,web3, BN, setProvider } from '@coral-xyz/anchor';
import  idl from "./journalapp.json";
import {Journalapp} from "./journalapp";
import { PublicKey } from '@solana/web3.js';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);

const programID = new PublicKey(idl.address);



export const Bank: FC = () => {
    const ourWallet = useWallet();
    const {connection} = useConnection();
    const [journals, setJournals] = useState([])
    const [title,setTitle] = useState("");
    const [message, setMessage] = useState("");

    const getProvider =  () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions() );
        setProvider(provider);
        return provider;
    }

    const createJournal = async (title:string,message:string) => {
        try {
            const anchProvider = getProvider();
            const program = new Program<Journalapp>(idl_object, anchProvider);
            await program.methods.createJournalEntry(
                title,
                message,
            ).accounts({
                owner: anchProvider.publicKey
            }).rpc();
            setTitle(title)
            setMessage(message)
            console.log("Wow, new Journal was created!");
        } catch (error) {
            console.error(`Error while creating a Journal Entry ${error}`);
        }
    }
    const getJournals = async () => {
        try {
            const anchProvider = getProvider()
            const program = new Program<Journalapp>(idl_object, anchProvider)
            Promise.all((await connection.getParsedProgramAccounts(programID)).map(async journal => ({
                ...((await program.account.journalEntryState.fetch(journal.pubkey))),
                pubkey: journal.pubkey
            }))).then(journals => {
                console.log(journals)
                setJournals(journals)
            })


        } catch (error) {
            console.error("Error while getting Journals: " + error)
        }
    }
    const updateJournal = async (title:string,message:string) => {
        try {
            const anchProvider = getProvider();
            const program = new Program<Journalapp>(idl_object, anchProvider);
            await program.methods.updateJournalEntry(
                title,
                message,
            ).accounts({
                owner: anchProvider.publicKey
            }).rpc();
            setMessage(message)
            console.log("Wow, new Journal was Updated!");
        } catch (error) {
            console.error(`Error while updating a Journal Entry ${error}`);
        }
    }
    const deleteJournal = async () => {
        try {
            const anchProvider = getProvider();
            const program = new Program<Journalapp>(idl_object, anchProvider);
            await program.methods.deleteJournalEntry("Hello World!").accounts({
                owner: anchProvider.publicKey
            }).rpc();
            console.log("Wow, new Journal was Deleted!");
        } catch (error) {
            console.error(`Error while deleting a Journal Entry ${error}`);
        }
    }
    // const onClick = useCallback(async () => {
    //     try {
    //         // `publicKey` will be null if the wallet isn't connected
    //         if (!publicKey) throw new Error('Wallet not connected!');
    //         // `signMessage` will be undefined if the wallet doesn't support it
    //         if (!signMessage) throw new Error('Wallet does not support message signing!');
    //         // Encode anything as bytes
    //         const message = new TextEncoder().encode('Hello, world!');
    //         // Sign the bytes using the wallet
    //         const signature = await signMessage(message);
    //         // Verify that the bytes were signed using the private key that matches the known public key
    //         if (!verify(signature, message, publicKey.toBytes())) throw new Error('Invalid signature!');
    //         notify({ type: 'success', message: 'Sign message successful!', txid: bs58.encode(signature) });
    //     } catch (error: any) {
    //         notify({ type: 'error', message: `Sign Message failed!`, description: error?.message });
    //         console.log('error', `Sign Message failed! ${error?.message}`);
    //     }
    // }, [publicKey, notify, signMessage]);

    return (
              <div>
            {
                journals.map((journal) => {
                    return (
                        <div className='md:hero-content flex flex-col border'>
                            <h1>{journal.title.toString()}</h1>
                            <textarea 
                            value={journal.message.toString()}
                            // onChange={(e)=>setMessage(e.target.value)}
                            />
                            {/* <span>{journal.message.toString()}</span> */}
                            <div className='md:hero-content flex flex-row'>
                            <button
                                className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => updateJournal(title,message)}
                                >
                                <span>
                                    Update
                                </span>
                            </button>
                            <button
                                className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => deleteJournal()}
                                >
                                <span>
                                    Delete
                                </span>
                            </button>
                            </div>
                            
                        </div>
                    )
                })
            }
            <div>
                        <input 
                        type='text' 
                        placeholder='Enter Title' 
                        name="title"
                        // value={title}
                        // onChange={(e)=>setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <textarea  
                        placeholder='Enter Message' 
                        name="message"
                        // value={message}
                        // onChange={(e)=>setMessage(e.target.value)}
                        />
                    </div>  
                <div className="flex flex-row justify-center">
                    
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={()=>createJournal(title,message)} 
                    disabled={!PublicKey}
                >
                   
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        Create Journal 
                    </span>
                </button>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={getJournals} disabled={!PublicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        get Journals
                    </span>
                </button>
            </div>
        </div>
        </div>
        
    );
};
