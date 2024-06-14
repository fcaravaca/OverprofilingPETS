import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import {useChromeStorageLocal} from 'use-chrome-storage';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack'
import WarningIcon from '@mui/icons-material/Warning';
export default function Terms(){

    const [searchParams, setSearchParams] = useSearchParams();
    const [terms, setTerms] = useChromeStorageLocal("terms");
    const [termsUpdated, setTermsUpdated] = useChromeStorageLocal("termsUpdated");

    function handleButton(response){
        setTermsUpdated(response)
        setTerms(response)
    }

    useEffect(()=>{
        if(terms === "agree"){
          setSearchParams({route: "demographic_data"})
        }else if(terms === "deny"){
          setSearchParams({route: "terms_deny"})
        }
    }, [terms, setSearchParams])


    return(
    <div className="div_explanation">
      {termsUpdated ? 
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.3}> 
        <WarningIcon/><h2>The terms of the extension had been updated</h2>
          </Stack>
      : ""}
      <h1>Overprofiling project</h1>
        Please, read carefully the following information. In case you do not agree
        with any of the points explained, uninstall the extension.
        <p>
          <b>CONTROLLER:</b> Universidad Carlos III de Madrid.
          </p>
          <p>
          <b>IDENTIFICATION OF PROCESSING:</b> PI sobreperfilado de usuarios en grandes plataformas de internet
          </p>
          <p>

          <b>EXERCISE OF RIGHTS:</b> You may exercise your rights of access, rectification, erasure, right to
            restriction of processing, data portability and to object, by sending an e-mail to the following
            email address: dpd@uc3m.es
            ADDITIONAL INFORMATION: Additional and detailed information about our Privacy Policy can
            be found at <a style={{color: "white"}} href="https://www.uc3m.es/protecciondedatos">https://www.uc3m.es/protecciondedatos</a>
          </p>
          <h3>Purpose</h3>
      <p>The goal of this research project is willing to understand how accurate are the profiles Big. Tech companies create from users. In particular, we focus on the following companies: Facebook, Twitter, LinkedIn, and Google. The way these companies operate is by creating a profile for a user based on the activity of this user assigning them demographic information (e.g., gender, age, location, etc,), interests (e.g., soccer, music, Italian food, etc.), and other elements. The referred companies allow advertisers to run ad campaigns targeting specific profiles defined by the advertiser. Our research project aims to use advanced research techniques to quantify how accurate the profiles created by Big. Tech companies are. This will allow us to answer questions like: Do BigTech companies assign users a reasonable number of interests or instead they assign a very large number of interests beyond what an actual human being can cope with? The interests assigned are actually relevant for the users or in fact they are not aligned with what users are interested in? etc. </p>
      <p>To run this project we will have to collect the interests the four referred companies assign to users. To this end we have developed a web browser add-on that implements this task. The web browser add-on will operate only upon the user providing explicit consent by accepting these terms of use. </p>
      <p>The data collected for this research project is limited to research purposes and will not be used for commercial purposes.</p>
      
      <h3>Data collected and Processing</h3>
      <p>The main piece of data we collect is the interests assigned to the users. While our intention is not to collect personal data, we understand that the combination of many interests together may make a user unique in a given platform (e.g., Facebook), and then we have adopted a conservative approach and managed that information as personal data.
This is the main reason why we ask you an explicit consent when installing the browser add-on.</p>
      <p>Following, we list the information we collect:</p>
      <ul>
        <li><b>Interests:</b> We collect interests associated with your Facebook, Twitter, LinkedIn, and Google profiles. We collect this information through the Ad Preference Managers (APMs) of each platform every 30 minutes. These are the links from where we collect the information:</li>
          <p><span>Facebook:</span>  <a style={{color: "white"}} href="https://m.facebook.com/ads/preferences/categories/"  rel="noreferrer" target="_blank">https://m.facebook.com/ads/preferences/categories/</a></p>
          <p><span>Twitter:</span> <a style={{color: "white"}} href="https://twitter.com/settings/your_twitter_data/twitter_interests"  rel="noreferrer" target="_blank">https://twitter.com/settings/your_twitter_data/twitter_interests</a> </p>
          <p><span>LinkedIn:</span>  <a style={{color: "white"}} href="https://www.linkedin.com/psettings/advertising/li-enterprise-product"  rel="noreferrer" target="_blank">https://www.linkedin.com/psettings/advertising/li-enterprise-product</a> </p>
          <p><span>Google:</span> <a style={{color: "white"}} href="https://adssettings.google.com/"  rel="noreferrer" target="_blank">https://adssettings.google.com/</a></p>

        <li><b>Demographic estimations:</b> we collect Google Demographic estimations which are on the same site that the interests.</li>

        <li><b>Ads:</b> we collect the Ads delivered to you on Facebook, Twitter, LinkedIn, YouTube, and general websites.
          This includes IDs of the ad, post, images, text associated with them, author of the ad, and landing page. 
          We also collect the explanations of why you received a specific ad (these reasons may include your approximate location).
          In the case of Google ads, will we also collect the HTML of the ad and in which URL the ad was shown to you. On YouTube, video ads are not collected.</li>

        <li><b>Clicks on ads:</b> the extension will also collect whether you have clicked an ad or visited the landing page of any ad.</li>

        <li><b>Basic demographic questionnaire</b>: if you agree with these terms, we will ask you for demographic data such as your country, age range, and gender.</li>

        <li><b>Ads, demographic estimations and, interests valuations</b>: we will ask you to rate ads (rated from 1 to 5 points and in which platform do you think the ad comes from), demographic data (whether they are correct) and, interests (rated from 1 to 5 points).</li>

          <li><b>Percentage of posts that are ads:</b> we collect the number of posts and ads shown to you on Twitter, LinkedIn, and Facebook to get which percentage of posts are ads. We do not collect any other information about non-ad posts.</li>


        <li><b>Topics inferred from history: </b>we retrieve the list of hosts that you have visited in the previous two months: we will not save this information; we only need the hostnames to be able to assign topics to each hostname. 
        Then, your history will be used to compute a topic list depending on the topics and the frequency of the pages you had visited.
        </li> 
      </ul>
      <p>The data is accessed by inspecting the HTML of pages you use, analyzing HTTPS requests and responses, or making HTTPS requests using your browser to the different platforms (Twitter, Linkedin, Facebook, Google)</p>

      <p>The browser add-on allows the user to visualize the collected information through the browser add-on interface. </p>

      <p>We create a user ID generating a random 128-bit string that is created upon installing the browser add-on and accepting these terms of use. This ID and the information collected remain stored on the browser until you remove the extension.</p>
      <p>
      In addition, we also store the collected information in a backend server located at Universidad Carlos III de Madrid (UC3M) premises. This server is protected by advanced security measures provided by the IT services to protect the Universidad Carlos III de Madrid network. In addition, the server is behind a second local firewall. The server can only be accessed locally from the UC3M network or the VPN offered by UC3M. Access to the server is limited to the research team participating in the project under credentials protected by user and password. Similarly, access to the database storing the information is limited to the research team participating in the project and is also protected by user and password credentials.
      </p>
      <p>
      Finally, the information will be stored in the server for the purpose of the research project and will be removed 2 months after the publication of the final research article derived from this project. 
      </p>
      <h3>Do you agree?</h3>
      <p></p>

        <Button style={{margin: 10, color: "white", fontWeight: 600}} variant="contained" color="success" id="submit_button_adult" type="button"  className="button_submit" onClick={() => handleButton("agree")}>
          I give explicit consent
        </Button>
        <Button style={{margin: 10, color: "white", fontWeight: 600}} variant="contained" color="error" id="submit_button_minor" type="button" className="button_submit_not_agree" onClick={() => handleButton("deny")}>
          I do not agree
        </Button>
    </div>
    )
}