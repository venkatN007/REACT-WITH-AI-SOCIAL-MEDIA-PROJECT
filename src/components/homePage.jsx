import React from "react";
import { useState } from "react";
import './homePage.css';
function HomePage(){
    const [formData, setFormData] = useState({
        rawText:'',
        platforms:[],
    });
    const [geminiResponse, setGeminiResponse] = useState("")
    const [structuredPosts, setStructuredPosts] = useState([])

    // Parse a Gemini response string into an array of { platformName, post }
    function parseGeminiResponse(response) {
        if (!response || typeof response !== 'string') return [];

        // Normalize spacing
        const text = response.replace(/\r\n|\r|\n/g, '\n').trim();

        // Split into sections by occurrences of "Platform Name" (case-insensitive)
        const rawSections = text.split(/Platform Name/ig).slice(1);

        const results = rawSections.map((sec) => {
            // Try to locate the 'post' marker
            const postMarkerMatch = sec.match(/post\s*[:\-]?/i);
            let namePart = '';
            let postPart = '';

            if (postMarkerMatch) {
                const idx = postMarkerMatch.index;
                namePart = sec.slice(0, idx);
                postPart = sec.slice(idx + postMarkerMatch[0].length);
            } else {
                // No explicit 'post' marker — try to split on bold markers or line breaks
                const parts = sec.split(/\*\*|\n{2,}/);
                namePart = parts[0] || '';
                postPart = parts.slice(1).join('\n') || '';
            }

            // Clean platform name
            let platformName = namePart.replace(/[:\[\]\*\"\'\-]/g, ' ').trim();
            // Keep up to first reasonable token (like 'LinkedIn' or 'Instagram, and so on')
            platformName = platformName.split(/\n|post|,/i)[0].trim();

            // Clean post content
            let post = postPart.replace(/\*\*/g, '').trim();
            // Remove wrapping quotes if present
            post = post.replace(/^['\"]+/, '').replace(/['\"]+$/, '').trim();

            // If the post contains additional 'Platform Name' markers (rare), cut them off
            const nextPlatformIdx = post.search(/Platform Name/i);
            if (nextPlatformIdx > -1) post = post.slice(0, nextPlatformIdx).trim();

            return {
                platformName: platformName || 'Unknown',
                post: post || ''
            };
        });

        return results.filter(r => r.post || r.platformName);
    }
    async function contactGemini() {
        try{
            const myHeaders = new Headers();
            myHeaders.append("X-goog-api-key", "AIzaSyCwGW6OuzYbXafMWerngyz9SAEhdbStPG0");
            myHeaders.append("Content-Type", "text/plain");
            var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify({ 
                            contents: [
                                { 
                                    parts: [   
                                        {  
                                            text: `i want to generate social media posts based on the raw text : ${formData.rawText} for the following platforms : ${formData.platforms.join(",")}. make sure tone of the post align with the platform .
                                            output structure : 
                                            Platform Name :[platformName] 
                                            post:[postContent]
                                            `
                                        }  
                                    ]
                                }
                            ]
                        }),
                redirect: "follow"
            };
            try{
                const res = await fetch(url, requestOptions);
                const data = await res.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    console.log(text);
                    setGeminiResponse(text);
                    const parsed = parseGeminiResponse(text);
                    console.log('parsed structured posts:', parsed);
                    setStructuredPosts(parsed);
            }catch(error){
                console.log(error);
            }
        }catch(error){
                console.log(error);
        }
        
    }
    return (
        <div className="homepage-container">
            <div className="homepage-header">
                <h1 className="homepage-title">Social Media Posts</h1>
            </div>

            <form className="homepage-form">
                <div className="input-card">
                    <h4 className="label">Enter Raw Text</h4>
                    <textarea className="raw-textarea" name="rawText" id="rawText" rows={12} onChange={e => {setFormData({...formData, rawText:e.target.value})}} value={formData.rawText}></textarea>

                    <h3 className="label" style={{marginTop:12}}>Platforms</h3>
                    <div className="platform-list">
                        <label className="platform-item"><input type="checkbox" name="platform" id="linkedIn"  value="Linkedin" onChange={(e) => {
                            if(e.target.checked){
                                setFormData({
                                    ...formData,
                                    platforms:[...formData.platforms, e.target.value]
                                })
                            }else if(e.target.checked == false){
                                setFormData ({
                                    ...formData,
                                    platforms:formData.platforms.filter((platform) => platform != e.target.value)
                                })
                            }
                        }}/><span>Linkedin</span></label>

                        <label className="platform-item"><input type="checkbox" name="platform" id="instagram"  value="Instagram" onChange={(e) => {
                            if(e.target.checked){
                                setFormData({
                                    ...formData,
                                    platforms:[...formData.platforms, e.target.value]
                                })
                            }else if(e.target.checked == false){
                                setFormData ({
                                    ...formData,
                                    platforms:formData.platforms.filter((platform) => platform != e.target.value)
                                })
                            }
                        }}/><span>Instagram</span></label>

                        <label className="platform-item"><input type="checkbox" name="platform" id="twitter"  value="Twitter" onChange={(e) => {
                            if(e.target.checked){
                                setFormData({
                                    ...formData,
                                    platforms:[...formData.platforms, e.target.value]
                                })
                            }else if(e.target.checked == false){
                                setFormData ({
                                    ...formData,
                                    platforms:formData.platforms.filter((platform) => platform != e.target.value)
                                })
                            }
                        }}/><span>Twitter</span></label>

                    </div>

                    <button type="button" className="cta-btn" onClick={() => contactGemini()}>Generate Posts</button>
                </div>

                <div className="results-column">
                    {structuredPosts.length > 0 ? (
                        structuredPosts.map((p, idx) => (
                            <div key={idx} className="post-card">
                                <div className="platform-name">Platform Name: {p.platformName}</div>
                                <div className="post-content">{p.post}</div>
                            </div>
                        ))
                    ) : (
                        geminiResponse.length > 0 && <pre className="raw-response">{geminiResponse}</pre>
                    )}
                </div>
            </form>
        </div>
    )
    
}
export default HomePage;
