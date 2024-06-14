
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

// Stylesheets
import '../App.css';



export default function Home(){

    return(
        <div>
            <div style={{width: "100%", margin: "auto", paddingBottom: 20}}>
            <ButtonGroup
                orientation="vertical"
                aria-label="vertical contained button group"
                variant="contained"
                color="secondary"
            >
                    <Button onClick={() => window.open("/popup.html?route=interests", '_blank').focus()}>Interests</Button>
                    <Button onClick={() => window.open("/popup.html?route=ads", '_blank').focus()}>Ads collected</Button>
                    <Button onClick={() => window.open("/popup.html?route=classify_ad", '_blank').focus()}>Classify Ads</Button>
            </ButtonGroup>

            </div>
        </div>
    )
}