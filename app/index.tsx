import { useState, useRef } from "react";
import {View, Text, StyleSheet, TextInput, Pressable, Animated, ScrollView, Modal} from "react-native";


type ConversationType = {
    id: number;
    promt: string;
    response: string | null;
    time: string;
    isWaiting?: boolean;
};


const MODEL_API_URL = "http://localhost:8000/generate";

async function askModel(prompt: string): Promise<string> {
    const response = await fetch(MODEL_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt,
            max_new_tokens: 128,
        }),
    });

    if (!response.ok) {
        throw new Error("Model request failed");
    }

    const data = await response.json();
    return data.answer;
}

function cleanAndNormalize(value: string | null): string 
{
    return value ? value.trim() : "";
}

function cleanAndNormalizeTime(time: string): string 
{
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


interface ConversationProps {
    conversation: ConversationType;
}

function Conversation({conversation }: ConversationProps) 
{
    const _promt = cleanAndNormalize(conversation.promt);
    const _response = cleanAndNormalize(conversation.response);
    const _time = cleanAndNormalizeTime(conversation.time);

    return (
        <View style={conversationStyles.mainContainer}>

            {/* User Prompt (Right) */}
            <View style={[conversationStyles.bubble, conversationStyles.promtBubble]}>
                <Text style={conversationStyles.promtText}>{_promt}</Text>
            </View>

            {/* AI Response (Left) */}
            <View style={[conversationStyles.bubble, conversationStyles.responseBubble]}>
                {conversation.isWaiting ? (
                    <Text style={conversationStyles.waitingText}>...</Text>
                ) : (
                    <Text style={conversationStyles.responseText}>{_response}</Text>
                )}
            </View>

        </View>
    );
}

// --- Main Component ---
export default function Index() {
    const [promt, setPromt] = useState("");
    const [conversations, setConversations] = useState<ConversationType[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    const translateY = useRef(new Animated.Value(0)).current;

    const hoverIn = () => {
        Animated.timing(translateY, { toValue: -5, duration: 150, useNativeDriver: true }).start();
    };

    const hoverOut = () => {
        Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    };

    const sendPromt = async () => {
        const text = promt.trim();
        if (!text) return;

        const newId = Date.now();

        const newEntry: ConversationType = {
            id: newId,
            promt: text,
            response: null,
            time: new Date().toISOString(),
            isWaiting: true,
        };

        setConversations((prev) => [...prev, newEntry]);
        setPromt("");

        try {
            const reply = await askModel(text);

            setConversations((prev) =>
                prev.map((item) =>
                    item.id === newId
                        ? { ...item, response: reply, isWaiting: false }
                        : item
                )
            );
        } catch (err) {
            console.log(err);

            setConversations((prev) =>
                prev.map((item) =>
                    item.id === newId
                        ? {
                            ...item,
                            response: "Model bağlantısında bir hata oluştu.",
                            isWaiting: false,
                        }
                        : item
                )
            );
        }
    };


    return (
        <View style={styles.mainContainer}>
            
            <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Kirpi</Text>
            </View>

            <View style={styles.outerContentContainer}>

                <View style={styles.contentContainer}>
                    <View style={styles.conversationPromtContainer}>
                        
                        {/* CHAT AREA (Scrollable) */}
                        <ScrollView 
                            ref={scrollViewRef}
                            style={styles.conversationContainer}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            onContentSizeChange={() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }}
                        >
                            {conversations.map((item) => (
                                <Conversation 
                                    key={item.id}
                                    conversation={item}
                                />
                            ))}
                        </ScrollView>

                        {/* INPUT AREA (Fixed Height) */}
                        <View style={styles.promtContainer}>
                            <TextInput
                                style={styles.promtTextInputStyle}
                                placeholder="Type something..."
                                value={promt}
                                onChangeText={setPromt}
                                multiline
                                textAlignVertical="top"
                                underlineColorAndroid="transparent"
                            />
                            <View style={styles.sendPromtButtonContainer}>
                                <Animated.View style={{ transform: [{ translateY }] }}>
                                    <Pressable
                                        onHoverIn={hoverIn}
                                        onHoverOut={hoverOut}
                                        onPress={sendPromt}
                                        style={styles.sendPromtButton}
                                    >
                                        <Text style={styles.sendPromtButtonText}>Send</Text>
                                    </Pressable>
                                </Animated.View>
                            </View>

                        </View>

                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Kirpi can make mistakes, check important info</Text>
                        </View>
                    </View>
                </View>

            </View>

        </View>
    );
}

// --- Styles ---
const conversationStyles = StyleSheet.create({
    mainContainer: { 
        width: "100%", 
        marginBottom: 15 
    },
    bubble: { 
        padding: 12, 
        borderRadius: 18, 
        maxWidth: "85%"
    },
    promtBubble: {
        backgroundColor: "#2E2E38",
        alignSelf: "flex-end",
        borderBottomRightRadius: 2,
    },
    responseBubble: {
        backgroundColor: "#FFFFFF",
        alignSelf: "flex-start",
        borderBottomLeftRadius: 2,
    },
    promtText: { 
        color: "white", 
        fontFamily: "monospace", 
        fontSize: 14 
    },
    responseText: { 
        color: "black", 
        fontFamily: "monospace", 
        fontSize: 14 
    },
    waitingText: { 
        color: "#888", 
        fontSize: 14, 
        fontWeight: "bold" 
    },
    bottomRow: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        marginTop: 5, 
        paddingHorizontal: 5 
    },
    timeStampStyle: { 
        fontSize: 10, 
        color: "#aaa", 
        fontFamily: "monospace" 
    },
    tryAgainButtonText: { 
        fontSize: 10, 
        color: "#81AE9D", 
        textDecorationLine: "underline", 
        fontFamily: "monospace" 
    },
});

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#1E1E24",
        alignItems: "center",
    },
    titleContainer: {
        width: "100%",
        marginLeft: 40,
        marginTop: 10,
    },
    titleText: {
        fontFamily: "monospace",
        color: "white",
        fontSize: 16,
    },
    outerContentContainer: {
        flex: 1,
        padding: 40,
        width: "100%",
        alignItems: "center",
    },
    contextButton: {
        position: "absolute",
        top: 20,
        right: 20,
        backgroundColor: "#81AE9D",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        zIndex: 10,
    },
    contextButtonText: { color: "#1E1E24", fontWeight: "bold", fontFamily: "monospace" },
    contentContainer: { flex: 1, width: "100%", maxWidth: 800, paddingHorizontal: 15 },
    conversationPromtContainer: { flex: 1 },
    conversationContainer: {
        flex: 1, 
        backgroundColor: "rgba(129, 174, 157, 0.1)",
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
    },
    promtContainer: {
        height: 220, // Fixed height for input area
        backgroundColor: "#81AE9D",
        borderRadius: 15,
        padding: 15,
        
    },
    promtTextInputStyle: {
        flex: 1,
        fontSize: 16,
        fontFamily: "monospace",
        color: "#1E1E24",
        outlineStyle: "none" as any, // Fix for Web focus ring
    },
    sendPromtButtonContainer: { alignItems: "flex-end" },
    sendPromtButton: {
        backgroundColor: "#1E1E24",
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 10,
    },
    sendPromtButtonText: { color: "white", fontFamily: "monospace", fontWeight: "bold" },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "white",
        width: "100%",
        maxWidth: 600,
        height: "70%",
        borderRadius: 20,
        padding: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, fontFamily: "monospace" },
    contextInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 15,
        fontFamily: "monospace",
    },
    closeButton: {
        backgroundColor: "#1E1E24",
        marginTop: 15,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    closeButtonText: { color: "white", fontWeight: "bold" },
    footerContainer: {
        marginTop: 10,
        alignItems: "center",
    },
    footerText: {
        fontFamily: "monospace",
        color: "white",
        fontSize: 12,
    }
});