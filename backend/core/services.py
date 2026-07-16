def compatibility(a,b):
 av,bv=set(map(str.lower,a.values)),set(map(str.lower,b.values));ai,bi=set(map(str.lower,a.interests)),set(map(str.lower,b.interests));ag,bg=set(map(str.lower,a.life_goals)),set(map(str.lower,b.life_goals));shared_values=av&bv;shared_interests=ai&bi;shared_goals=ag&bg
 score=35+min(25,len(shared_values)*10)+min(15,len(shared_interests)*5)+min(15,len(shared_goals)*7)+(10 if a.connection_goal==b.connection_goal else 0)
 reasons=[]
 if shared_values:reasons.append('Shared values: '+', '.join(sorted(shared_values)[:2]).title())
 if shared_interests:reasons.append('Mutual interests: '+', '.join(sorted(shared_interests)[:2]).title())
 if a.connection_goal==b.connection_goal:reasons.append('Aligned connection goals')
 if shared_goals:reasons.append('Shared life direction: '+', '.join(sorted(shared_goals)[:2]).title())
 if a.communication_style and b.communication_style:reasons.append('Compatible communication intentions')
 return min(score,99),reasons or ['Potential for a fresh perspective']
