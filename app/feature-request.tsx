export function FeatureRequest({restaurantId}:{restaurantId?:string}){return <section className="feature-request panel inset"><div><span className="eyebrow">もっと使いやすくするために</span><h2>欲しい機能・情報を教えてください</h2><p>未掲載の地域、増やしたい検索条件など、ご要望を受け付けています。</p></div><a className="button" href={'/contact?type=feature'+(restaurantId?'&restaurant='+encodeURIComponent(restaurantId):'')}>機能・掲載情報をリクエスト →</a></section>;}

